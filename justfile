uuid := `jq -r .uuid metadata.json`
schema_id := `jq -r '.["settings-schema"]' metadata.json`
schema_path := replace(schema_id, ".", "/")
build_dir := "build"
dist := "dist"
install_dir := env("HOME") / ".local/share/gnome-shell/extensions" / uuid

build:
    npm run format:check
    npm run lint
    npm run build
    @cp metadata.json {{ build_dir }}/
    @mkdir -p {{ build_dir }}/schemas
    @sed -e 's/@SCHEMA_ID@/{{ schema_id }}/g' -e 's|@SCHEMA_PATH@|{{ schema_path }}|g' schemas/gschema.xml.template > {{ build_dir }}/schemas/{{ schema_id }}.gschema.xml
    glib-compile-schemas {{ build_dir }}/schemas/
    @cp -r icons {{ build_dir }}/

pack: build
    @mkdir -p {{ dist }}
    cd {{ build_dir }} && zip -r ../{{ dist }}/{{ uuid }}.zip .

install: build
    rm -rf {{ install_dir }}
    @mkdir -p {{ install_dir }}
    cp -r {{ build_dir }}/* {{ install_dir }}/
    @echo "Installed to {{ install_dir }}"

clean:
    rm -rf {{ build_dir }} {{ dist }}
