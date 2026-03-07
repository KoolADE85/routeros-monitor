uuid := "mikrotik@com.adrianborrmann"
dist := "dist"
schema_dir := "schemas"
install_dir := env("HOME") / ".local/share/gnome-shell/extensions" / uuid

build:
    npm run format:check
    npm run lint
    npm run build
    @cp metadata.json {{ dist }}/
    @cp -r {{ schema_dir }} {{ dist }}/
    glib-compile-schemas {{ dist }}/{{ schema_dir }}/
    @cp -r icons {{ dist }}/

pack: build
    cd {{ dist }} && zip -r ../{{ uuid }}.zip .

install: build
    rm -rf {{ install_dir }}
    @mkdir -p {{ install_dir }}
    cp -r {{ dist }}/* {{ install_dir }}/
    @echo "Installed to {{ install_dir }}"

clean:
    rm -rf {{ dist }} {{ uuid }}.zip
