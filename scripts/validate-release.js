const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

function readText(relativePath) {
    return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function fileExists(relativePath) {
    return fs.existsSync(path.join(repoRoot, relativePath));
}

function fileStat(relativePath) {
    return fs.statSync(path.join(repoRoot, relativePath));
}

function makeCheck(name, pass, detail) {
    return { name, pass, detail };
}

function pushCheck(checks, name, pass, detail) {
    checks.push(makeCheck(name, pass, detail));
}

function latestTimestamp(paths) {
    return paths.reduce((latest, relativePath) => {
        const mtimeMs = fileStat(relativePath).mtimeMs;
        return mtimeMs > latest ? mtimeMs : latest;
    }, 0);
}

function formatTimestamp(timestampMs) {
    return new Date(timestampMs).toISOString();
}

const pkg = JSON.parse(readText('package.json'));
const version = pkg.version;
const artifactRelativePath = path.join('dist', `KityDD ${version}.exe`);

const files = {
    packageJson: readText('package.json'),
    readme: readText('README.md'),
    changelog: readText('CHANGELOG.md'),
    releaseNotes: readText('RELEASE_NOTES.md'),
    main: readText('main.js'),
    index: readText(path.join('local-kity-minder', 'index.html')),
    diy: readText(path.join('local-kity-minder', 'diy.js')),
    editor: readText(path.join('local-kity-minder', 'kityminder.editor.js')),
    language: readText(path.join('local-kity-minder', 'language.js')),
    style: readText(path.join('local-kity-minder', 'style.css')),
    core: readText(path.join('local-kity-minder', 'bower_components', 'kityminder-core', 'dist', 'kityminder.core.js'))
};

const checks = [];
const customThemes = ['dark', 'dark-compact', 'ocean', 'ocean-compact', 'monochrome', 'monochrome-compact', 'forest', 'forest-compact', 'sunrise', 'sunrise-compact', 'rose', 'rose-compact', 'solarized', 'solarized-compact'];
const customTemplates = ['left', 'logical'];
const releaseInputs = [
    'package.json',
    'README.md',
    'CHANGELOG.md',
    'RELEASE_NOTES.md',
    'main.js',
    path.join('local-kity-minder', 'index.html'),
    path.join('local-kity-minder', 'diy.js'),
    path.join('local-kity-minder', 'kityminder.editor.js'),
    path.join('local-kity-minder', 'language.js'),
    path.join('local-kity-minder', 'style.css'),
    path.join('local-kity-minder', 'bower_components', 'kityminder-core', 'dist', 'kityminder.core.js')
];

pushCheck(checks, 'package version', version === '2.0.0', version);
pushCheck(checks, 'README current release', files.readme.includes('**v2.0.0** (2026-04-22)'), 'README current release block');
pushCheck(checks, 'README theme count', files.readme.includes('34 colour themes'), 'README feature summary');
pushCheck(checks, 'README documents validation command', files.readme.includes('npm run validate:release'), 'README validation section');
pushCheck(checks, 'CHANGELOG current version', files.changelog.includes('## [2.0.0] - 2026-04-22'), 'CHANGELOG heading');
pushCheck(checks, 'CHANGELOG mentions validation script', files.changelog.includes('`npm run validate:release`'), 'CHANGELOG release notes');
pushCheck(checks, 'RELEASE_NOTES current version', files.releaseNotes.includes('## v2.0.0 (2026-04-22)'), 'RELEASE_NOTES heading');
pushCheck(checks, 'RELEASE_NOTES mentions validation command', files.releaseNotes.includes('`npm run validate:release`'), 'RELEASE_NOTES validation section');
pushCheck(checks, 'RELEASE_NOTES template icon description', files.releaseNotes.includes('custom SVG icons'), 'template icon wording');
pushCheck(checks, 'package scripts include validate:release', files.packageJson.includes('"validate:release": "node scripts/validate-release.js"'), 'package.json scripts');
pushCheck(checks, 'index loads style.css', files.index.includes('href="style.css"'), 'style.css link');
pushCheck(checks, 'About modal theme summary', files.index.includes('34 themes including Dark, Ocean, Forest'), 'About modal feature highlight');
pushCheck(checks, 'index loads patched core', files.index.includes('kityminder.core.js') && !files.index.includes('kityminder.core.min.js'), 'core script path');
pushCheck(checks, 'PNG export patch markers', files.core.includes('var scale = 2') && files.core.includes('ctx.scale(scale, scale)'), '2x export markers');
pushCheck(checks, 'About menu IPC send', files.main.includes("webContents.send('show-about')"), 'main.js About menu');
pushCheck(checks, 'About modal listener', files.diy.includes("ipcRenderer.on('show-about'") && files.diy.includes("$('#kityddAboutModal').modal('show')"), 'renderer About listener');
pushCheck(checks, 'Templates registered', customTemplates.every((key) => files.diy.includes(`getTemplateList()['${key}']`)), customTemplates.join(', '));
pushCheck(checks, 'Theme definitions registered', customThemes.every((key) => files.diy.includes(`themes['${key}']`)), customThemes.join(', '));
pushCheck(checks, 'Theme key list includes custom themes', customThemes.every((key) => files.editor.includes(`'${key}'`)), customThemes.join(', '));
pushCheck(checks, 'Theme list paired rows', files.editor.includes('themeRowList') && files.editor.includes('row.primary') && files.editor.includes('row.compact'), 'primary/compact row layout');
pushCheck(checks, 'Template swatch CSS selectors', files.style.includes('.temp-item.left') && files.style.includes('.temp-item.logical'), 'left/logical selectors');
pushCheck(checks, 'Template swatch SVG icons', files.style.includes("background-image: url(") && files.style.includes('.temp-item.left') && files.style.includes('.temp-item.logical'), 'SVG data-URI icons');
pushCheck(checks, 'Theme list scrollable', files.style.includes('.theme-list') && files.style.includes('overflow-y: auto'), 'theme-list max-height + scroll');
pushCheck(checks, 'Theme list active state', files.style.includes('.theme-item-active') && files.editor.includes('theme-item-active'), 'active theme highlight');
pushCheck(checks, 'Language pack template keys', customTemplates.every((key) => files.language.includes(`'${key}'`) || files.language.includes(`"${key}"`)), customTemplates.join(', '));
pushCheck(checks, 'Language pack theme keys', customThemes.every((key) => files.language.includes(`'${key}'`) || files.language.includes(`"${key}"`)), customThemes.join(', '));

const themeListMatch = files.editor.match(/\$scope\.themeKeyList\s*=\s*\[([\s\S]*?)\];/);
if (themeListMatch) {
    const themeKeys = Array.from(themeListMatch[1].matchAll(/'([^']+)'/g)).map((match) => match[1]);
    pushCheck(checks, 'Theme list count', themeKeys.length === 34, String(themeKeys.length));
} else {
    pushCheck(checks, 'Theme list count', false, 'themeKeyList not parsed');
}

if (fileExists(artifactRelativePath)) {
    const artifactTimestamp = fileStat(artifactRelativePath).mtimeMs;
    const latestInputTimestamp = latestTimestamp(releaseInputs);

    pushCheck(checks, 'Release EXE exists', true, artifactRelativePath);
    pushCheck(
        checks,
        'Release EXE is up to date',
        artifactTimestamp >= latestInputTimestamp,
        `exe=${formatTimestamp(artifactTimestamp)} latest-input=${formatTimestamp(latestInputTimestamp)}`
    );
} else {
    pushCheck(checks, 'Release EXE exists', false, artifactRelativePath);
    pushCheck(checks, 'Release EXE is up to date', false, 'build artifact missing');
}

const failedChecks = checks.filter((check) => !check.pass);
const report = {
    version,
    artifact: artifactRelativePath,
    checks,
    failedCount: failedChecks.length
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.exit(failedChecks.length === 0 ? 0 : 1);