use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_schema",
            sql: include_str!("../../src/lib/db/migrations/0001_initial.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "document_sequences",
            sql: include_str!("../../src/lib/db/migrations/0002_document_sequences.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "global_discount_columns",
            sql: include_str!("../../src/lib/db/migrations/0003_global_discount.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "intro_closing_text",
            sql: include_str!("../../src/lib/db/migrations/0004_intro_closing.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:doxpro.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
