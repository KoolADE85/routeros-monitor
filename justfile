uuid := `jq -r .uuid metadata.json`
schema_id := `jq -r '.["settings-schema"]' metadata.json`
schema_path := replace(schema_id, ".", "/")
dist := "dist"
install_dir := env("HOME") / ".local/share/gnome-shell/extensions" / uuid

build:
    npm run format:check
    npm run lint
    npm run build
    @cp metadata.json {{ dist }}/
    @mkdir -p {{ dist }}/schemas
    sed -e 's/@SCHEMA_ID@/{{ schema_id }}/g' -e 's|@SCHEMA_PATH@|{{ schema_path }}|g' schemas/gschema.xml.template > {{ dist }}/schemas/{{ schema_id }}.gschema.xml
    glib-compile-schemas {{ dist }}/schemas/
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
