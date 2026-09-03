use serde::Serialize;
use std::path::{Path, PathBuf};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WebviewWindow,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

/// Aplicativo instalado, ja resolvido para o SO em execucao.
#[derive(Serialize)]
struct AppEntry {
    id: String,
    name: String,
    subtitle: String,
    /// Linha de comando para abrir o app; o indice 0 e o executavel.
    argv: Vec<String>,
}

fn show_window(window: &WebviewWindow) {
    let _ = window.show();
    let _ = window.set_focus();
}

fn toggle_window(window: &WebviewWindow) {
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
    } else {
        show_window(window);
    }
}

// ---------------------------------------------------------------- Linux

#[cfg(target_os = "linux")]
fn application_dirs() -> Vec<PathBuf> {
    let mut dirs: Vec<PathBuf> = std::env::var("XDG_DATA_DIRS")
        .unwrap_or_else(|_| "/usr/local/share:/usr/share".to_string())
        .split(':')
        .filter(|dir| !dir.is_empty())
        .map(|dir| Path::new(dir).join("applications"))
        .collect();

    if let Some(home) = std::env::var_os("HOME") {
        dirs.push(Path::new(&home).join(".local/share/applications"));
    }

    dirs
}

/// Le um `.desktop` segundo a Desktop Entry Specification (apenas os campos
/// que interessam para lancar o app a partir da busca).
#[cfg(target_os = "linux")]
fn parse_desktop_entry(path: &Path) -> Option<AppEntry> {
    let content = std::fs::read_to_string(path).ok()?;
    let mut fields: std::collections::HashMap<&str, &str> = std::collections::HashMap::new();
    let mut in_entry = false;

    for line in content.lines() {
        let line = line.trim();
        if line.starts_with('[') {
            in_entry = line == "[Desktop Entry]";
            continue;
        }
        if !in_entry || line.starts_with('#') {
            continue;
        }
        if let Some((key, value)) = line.split_once('=') {
            // A primeira ocorrencia vence; variantes localizadas (`Name[pt_BR]`)
            // sao chaves distintas e por isso nao sobrescrevem a padrao.
            fields.entry(key.trim()).or_insert(value.trim());
        }
    }

    if fields.get("Type") != Some(&"Application")
        || fields.get("NoDisplay") == Some(&"true")
        || fields.get("Hidden") == Some(&"true")
        // Sem um terminal para hospedar, esses lancariam um processo invisivel.
        || fields.get("Terminal") == Some(&"true")
    {
        return None;
    }

    let name = (*fields.get("Name")?).to_string();

    // `Exec` carrega field codes (%u, %F, %i, ...) que so fazem sentido quando
    // o app recebe arquivos/URLs; aqui sao removidos.
    let argv: Vec<String> = fields
        .get("Exec")?
        .split_whitespace()
        .filter(|token| !(token.len() == 2 && token.starts_with('%')))
        .map(|token| token.trim_matches('"').to_string())
        .collect();

    if argv.is_empty() {
        return None;
    }

    Some(AppEntry {
        id: path.file_stem()?.to_string_lossy().to_string(),
        name,
        subtitle: fields
            .get("Comment")
            .map(|c| c.to_string())
            .unwrap_or_else(|| "Aplicativo".to_string()),
        argv,
    })
}

#[cfg(target_os = "linux")]
fn collect_apps() -> Vec<AppEntry> {
    let mut apps = Vec::new();

    for dir in application_dirs() {
        let Ok(entries) = std::fs::read_dir(&dir) else {
            continue;
        };
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().is_some_and(|ext| ext == "desktop") {
                if let Some(app) = parse_desktop_entry(&path) {
                    apps.push(app);
                }
            }
        }
    }

    apps
}

// -------------------------------------------------------------- Windows

#[cfg(target_os = "windows")]
fn application_dirs() -> Vec<PathBuf> {
    ["ProgramData", "APPDATA"]
        .iter()
        .filter_map(std::env::var_os)
        .map(|base| Path::new(&base).join(r"Microsoft\Windows\Start Menu\Programs"))
        .collect()
}

/// Varre o Menu Iniciar atras de atalhos. O `.lnk` nao e interpretado: quem
/// resolve o alvo e o `explorer.exe`, como num duplo clique.
#[cfg(target_os = "windows")]
fn collect_shortcuts(dir: &Path, depth: usize, apps: &mut Vec<AppEntry>) {
    if depth == 0 {
        return;
    }
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_shortcuts(&path, depth - 1, apps);
        } else if path.extension().is_some_and(|ext| ext == "lnk") {
            let Some(name) = path.file_stem().map(|s| s.to_string_lossy().to_string()) else {
                continue;
            };
            apps.push(AppEntry {
                id: name.clone(),
                name,
                subtitle: "Aplicativo".to_string(),
                argv: vec![
                    "explorer.exe".to_string(),
                    path.to_string_lossy().to_string(),
                ],
            });
        }
    }
}

#[cfg(target_os = "windows")]
fn collect_apps() -> Vec<AppEntry> {
    let mut apps = Vec::new();
    for dir in application_dirs() {
        collect_shortcuts(&dir, 6, &mut apps);
    }
    apps
}

#[cfg(not(any(target_os = "linux", target_os = "windows")))]
fn collect_apps() -> Vec<AppEntry> {
    Vec::new()
}

// -------------------------------------------------------------- Comandos

#[tauri::command]
fn list_apps() -> Vec<AppEntry> {
    let mut apps = collect_apps();
    apps.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    apps.dedup_by(|a, b| a.name == b.name);
    apps
}

#[tauri::command]
fn launch_app(argv: Vec<String>) -> Result<(), String> {
    let (program, args) = argv
        .split_first()
        .ok_or_else(|| "comando vazio".to_string())?;

    std::process::Command::new(program)
        .args(args)
        .spawn()
        .map(|_| ())
        .map_err(|e| format!("falha ao executar `{program}`: {e}"))
}

// ----------------------------------------------------------------- Setup

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![list_apps, launch_app])
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .ok_or("janela `main` nao encontrada")?;

            let show_item = MenuItem::with_id(app, "show", "Abrir", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            TrayIconBuilder::new()
                .icon(
                    app.default_window_icon()
                        .cloned()
                        .ok_or("icone padrao ausente")?,
                )
                .tooltip("atalho")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            show_window(&window);
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        if let Some(window) = tray.app_handle().get_webview_window("main") {
                            toggle_window(&window);
                        }
                    }
                })
                .build(app)?;

            let toggle = Shortcut::new(Some(Modifiers::ALT), Code::Space);
            let registered =
                app.global_shortcut()
                    .on_shortcut(toggle, |app, _shortcut, event| {
                        if event.state() == ShortcutState::Pressed {
                            if let Some(window) = app.get_webview_window("main") {
                                toggle_window(&window);
                            }
                        }
                    });

            // A janela nasce oculta e fora da barra de tarefas. Sem o atalho
            // global sobra o tray, mas abrir de cara deixa a falha visivel.
            if let Err(err) = registered {
                eprintln!("nao foi possivel registrar Alt+Space: {err}");
                show_window(&window);
            }

            Ok(())
        })
        .on_window_event(|_window, _event| {
            // Em dev a janela sumiria ao abrir o devtools, o que atrapalha; so em release.
            #[cfg(not(debug_assertions))]
            if let tauri::WindowEvent::Focused(false) = _event {
                let _ = _window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
