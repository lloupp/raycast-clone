use serde::Deserialize;
use tauri::{Manager, WebviewWindow};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

/// Programa a executar por sistema operacional. O indice 0 e o executavel.
#[derive(Deserialize)]
struct LaunchTarget {
    linux: Vec<String>,
    windows: Vec<String>,
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

#[tauri::command]
fn launch_app(target: LaunchTarget) -> Result<(), String> {
    let argv = if cfg!(target_os = "windows") {
        target.windows
    } else {
        target.linux
    };

    let (program, args) = argv
        .split_first()
        .ok_or_else(|| "comando vazio para este sistema".to_string())?;

    std::process::Command::new(program)
        .args(args)
        .spawn()
        .map(|_| ())
        .map_err(|e| format!("falha ao executar `{program}`: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![launch_app])
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .ok_or("janela `main` nao encontrada")?;

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

            // Sem atalho global nao ha como abrir a janela (ela nasce oculta e
            // fora da barra de tarefas), entao mostra em vez de ficar inacessivel.
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
