use std::process::{Command, Stdio};
use tauri::{Manager, WebviewWindow, WindowEvent};
use tauri_plugin_global_shortcut::ShortcutState;

const SUPPORTED_COMMANDS: &[&str] = &[
    "calculator",
    "terminal",
    "notes",
    "browser",
    "mail",
    "calendar",
    "github",
    "settings",
    "screenshot",
    "search-google",
];

fn toggle_window(window: &WebviewWindow) {
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
    } else {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn spawn(program: &str, args: &[&str]) -> Result<(), String> {
    Command::new(program)
        .args(args)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("Não foi possível iniciar {program}: {error}"))
}

fn spawn_first(candidates: &[(&str, &[&str])]) -> Result<(), String> {
    let mut last_error = String::from("nenhum aplicativo compatível encontrado");

    for (program, args) in candidates {
        match spawn(program, args) {
            Ok(()) => return Ok(()),
            Err(error) => last_error = error,
        }
    }

    Err(last_error)
}

fn open_target(target: &str) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        return spawn("rundll32.exe", &["url.dll,FileProtocolHandler", target]);
    }

    #[cfg(target_os = "macos")]
    {
        return spawn("open", &[target]);
    }

    #[cfg(target_os = "linux")]
    {
        return spawn("xdg-open", &[target]);
    }

    #[allow(unreachable_code)]
    Err(String::from("Sistema operacional não suportado"))
}

fn open_calculator() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        return spawn("calc.exe", &[]);
    }

    #[cfg(target_os = "macos")]
    {
        return spawn("open", &["-a", "Calculator"]);
    }

    #[cfg(target_os = "linux")]
    {
        return spawn_first(&[
            ("gnome-calculator", &[]),
            ("kcalc", &[]),
            ("qalculate-gtk", &[]),
        ]);
    }

    #[allow(unreachable_code)]
    Err(String::from("Calculadora não suportada neste sistema"))
}

fn open_terminal() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        return spawn_first(&[("wt.exe", &[]), ("powershell.exe", &[]), ("cmd.exe", &[])]);
    }

    #[cfg(target_os = "macos")]
    {
        return spawn("open", &["-a", "Terminal"]);
    }

    #[cfg(target_os = "linux")]
    {
        return spawn_first(&[
            ("x-terminal-emulator", &[]),
            ("gnome-terminal", &[]),
            ("konsole", &[]),
        ]);
    }

    #[allow(unreachable_code)]
    Err(String::from("Terminal não suportado neste sistema"))
}

fn open_notes() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        return spawn("notepad.exe", &[]);
    }

    #[cfg(target_os = "macos")]
    {
        return spawn("open", &["-a", "TextEdit"]);
    }

    #[cfg(target_os = "linux")]
    {
        return spawn_first(&[("gedit", &[]), ("kate", &[]), ("mousepad", &[])]);
    }

    #[allow(unreachable_code)]
    Err(String::from("Editor de texto não suportado neste sistema"))
}

fn open_settings() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        return spawn("cmd.exe", &["/C", "start", "", "ms-settings:"]);
    }

    #[cfg(target_os = "macos")]
    {
        return spawn("open", &["-a", "System Settings"]);
    }

    #[cfg(target_os = "linux")]
    {
        return spawn_first(&[("gnome-control-center", &[]), ("systemsettings", &[])]);
    }

    #[allow(unreachable_code)]
    Err(String::from("Configurações do sistema não suportadas"))
}

fn take_screenshot() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        return spawn("SnippingTool.exe", &[]);
    }

    #[cfg(target_os = "macos")]
    {
        return spawn("screencapture", &["-i"]);
    }

    #[cfg(target_os = "linux")]
    {
        return spawn_first(&[("gnome-screenshot", &["-a"]), ("spectacle", &["-r"])]);
    }

    #[allow(unreachable_code)]
    Err(String::from("Ferramenta de captura não suportada"))
}

fn run_command(command_id: &str, payload: Option<&str>) -> Result<(), String> {
    match command_id {
        "calculator" => open_calculator(),
        "terminal" => open_terminal(),
        "notes" => open_notes(),
        "browser" => open_target("https://www.google.com"),
        "mail" => open_target("mailto:"),
        "calendar" => open_target("https://calendar.google.com/"),
        "github" => open_target("https://github.com/"),
        "settings" => open_settings(),
        "screenshot" => take_screenshot(),
        "search-google" => {
            let query = payload.unwrap_or_default();
            open_target(&format!("https://www.google.com/search?q={query}"))
        }
        _ => Err(format!("Comando não permitido: {command_id}")),
    }
}

#[tauri::command]
fn execute_command(
    command_id: String,
    payload: Option<String>,
    webview_window: WebviewWindow,
) -> Result<(), String> {
    if !SUPPORTED_COMMANDS.contains(&command_id.as_str()) {
        return Err(format!("Comando não permitido: {command_id}"));
    }

    run_command(&command_id, payload.as_deref())?;
    webview_window
        .hide()
        .map_err(|error| format!("Comando executado, mas não foi possível fechar o launcher: {error}"))
}

#[tauri::command]
fn hide_launcher(webview_window: WebviewWindow) -> Result<(), String> {
    webview_window
        .hide()
        .map_err(|error| format!("Não foi possível fechar o launcher: {error}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcuts(["cmdOrControl+space"])
                .expect("atalho global inválido")
                .with_handler(|app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        if let Some(window) = app.get_webview_window("main") {
                            toggle_window(&window);
                        }
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![execute_command, hide_launcher])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let window_for_focus = window.clone();
                window.on_window_event(move |event| {
                    if matches!(event, WindowEvent::Focused(false)) {
                        let _ = window_for_focus.hide();
                    }
                });
                let _ = window.hide();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("erro ao executar o Atalho");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn native_command_allowlist_has_no_duplicates() {
        let mut sorted = SUPPORTED_COMMANDS.to_vec();
        sorted.sort_unstable();
        sorted.dedup();
        assert_eq!(sorted.len(), SUPPORTED_COMMANDS.len());
    }

    #[test]
    fn rejects_unknown_commands_before_execution() {
        assert!(!SUPPORTED_COMMANDS.contains(&"rm-everything"));
    }
}
