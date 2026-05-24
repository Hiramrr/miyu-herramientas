import re

# Path to the CSS file
css_path = 'src/styles/main.css'

# Read the file
with open(css_path, 'r') as f:
    content = f.read()

# Define diff variables for each theme
diff_vars = {
    ':root': '''      --diff-added-bg: #edf8ee;
      --diff-removed-bg: #fff1ee;
      --diff-changed-bg: #fff8e7;
      --diff-mark-bg: #f4ca64;
      --diff-mark-color: #2b2418;
      --diff-success-color: #276437;
      --diff-success-bg: #f1faef;''',
    'body.theme-dark': '''      --diff-added-bg: rgba(76, 175, 80, 0.18);
      --diff-removed-bg: rgba(244, 67, 54, 0.18);
      --diff-changed-bg: rgba(255, 193, 7, 0.15);
      --diff-mark-bg: #b88a30;
      --diff-mark-color: #e8e2da;
      --diff-success-color: #6abf6f;
      --diff-success-bg: rgba(76, 175, 80, 0.15);''',
    'body.theme-jazmin': '''      --diff-added-bg: #e8f5e9;
      --diff-removed-bg: #ffebee;
      --diff-changed-bg: #fff8e1;
      --diff-mark-bg: #c8a850;
      --diff-mark-color: #3d3a28;
      --diff-success-color: #5a7340;
      --diff-success-bg: #e8f0d8;''',
    'body.theme-hacker': '''      --diff-added-bg: rgba(0, 255, 0, 0.12);
      --diff-removed-bg: rgba(255, 0, 0, 0.15);
      --diff-changed-bg: rgba(255, 255, 0, 0.12);
      --diff-mark-bg: #00aa00;
      --diff-mark-color: #000000;
      --diff-success-color: #00cc00;
      --diff-success-bg: rgba(0, 255, 0, 0.12);''',
    'body.theme-ocean': '''      --diff-added-bg: rgba(56, 189, 248, 0.12);
      --diff-removed-bg: rgba(244, 63, 94, 0.12);
      --diff-changed-bg: rgba(125, 211, 252, 0.10);
      --diff-mark-bg: #38bdf8;
      --diff-mark-color: #0f172a;
      --diff-success-color: #7dd3fc;
      --diff-success-bg: rgba(56, 189, 248, 0.12);''',
    'body.theme-dracula': '''      --diff-added-bg: rgba(80, 250, 123, 0.12);
      --diff-removed-bg: rgba(255, 85, 85, 0.12);
      --diff-changed-bg: rgba(241, 250, 140, 0.10);
      --diff-mark-bg: #bd93f9;
      --diff-mark-color: #f8f8f2;
      --diff-success-color: #50fa7b;
      --diff-success-bg: rgba(80, 250, 123, 0.12);''',
    'body.theme-nord': '''      --diff-added-bg: rgba(163, 190, 140, 0.15);
      --diff-removed-bg: rgba(191, 97, 106, 0.15);
      --diff-changed-bg: rgba(235, 203, 139, 0.12);
      --diff-mark-bg: #88C0D0;
      --diff-mark-color: #D8DEE9;
      --diff-success-color: #a3be8c;
      --diff-success-bg: rgba(163, 190, 140, 0.15);''',
    'body.theme-solarized': '''      --diff-added-bg: rgba(42, 161, 152, 0.15);
      --diff-removed-bg: rgba(220, 50, 47, 0.15);
      --diff-changed-bg: rgba(181, 137, 0, 0.12);
      --diff-mark-bg: #268bd2;
      --diff-mark-color: #fdf6e3;
      --diff-success-color: #2aa198;
      --diff-success-bg: rgba(42, 161, 152, 0.15);''',
    'body.theme-solarized-light': '''      --diff-added-bg: #e8f5e9;
      --diff-removed-bg: #ffebee;
      --diff-changed-bg: #fff8e1;
      --diff-mark-bg: #b58900;
      --diff-mark-color: #586e75;
      --diff-success-color: #2aa198;
      --diff-success-bg: #e8f0e8;''',
    'body.theme-gruvbox': '''      --diff-added-bg: rgba(184, 187, 38, 0.15);
      --diff-removed-bg: rgba(204, 36, 29, 0.15);
      --diff-changed-bg: rgba(250, 189, 47, 0.12);
      --diff-mark-bg: #fabd2f;
      --diff-mark-color: #ebdbb2;
      --diff-success-color: #b8bb26;
      --diff-success-bg: rgba(184, 187, 38, 0.15);''',
    'body.theme-sakura': '''      --diff-added-bg: rgba(120, 220, 140, 0.15);
      --diff-removed-bg: rgba(232, 74, 111, 0.15);
      --diff-changed-bg: rgba(248, 164, 200, 0.12);
      --diff-mark-bg: #f8a4c8;
      --diff-mark-color: #f0d0e0;
      --diff-success-color: #78dc8c;
      --diff-success-bg: rgba(120, 220, 140, 0.15);''',
    'body.theme-lavender': '''      --diff-added-bg: #e8f5e9;
      --diff-removed-bg: #ffebee;
      --diff-changed-bg: #f3e5f5;
      --diff-mark-bg: #7c5cbf;
      --diff-mark-color: #2d2049;
      --diff-success-color: #6a8a50;
      --diff-success-bg: #e8ddf5;''',
    'body.theme-rosa': '''      --diff-added-bg: #e8f5e9;
      --diff-removed-bg: #ffebee;
      --diff-changed-bg: #fff8e1;
      --diff-mark-bg: #e85080;
      --diff-mark-color: #4a1028;
      --diff-success-color: #c04878;
      --diff-success-bg: #ffe8ee;''',
    'body.theme-sandia': '''      --diff-added-bg: rgba(106, 168, 106, 0.20);
      --diff-removed-bg: rgba(231, 76, 60, 0.20);
      --diff-changed-bg: rgba(240, 200, 200, 0.15);
      --diff-mark-bg: #c0392b;
      --diff-mark-color: #f0c8c8;
      --diff-success-color: #6a9a6a;
      --diff-success-bg: rgba(106, 168, 106, 0.20);''',
    'body.theme-matcha': '''      --diff-added-bg: #e8f5e9;
      --diff-removed-bg: #ffebee;
      --diff-changed-bg: #fff8e1;
      --diff-mark-bg: #5a7a4a;
      --diff-mark-color: #2c3e2c;
      --diff-success-color: #5a7a4a;
      --diff-success-bg: #e8e4d8;''',
    'body.theme-moka': '''      --diff-added-bg: rgba(129, 199, 132, 0.18);
      --diff-removed-bg: rgba(239, 83, 80, 0.18);
      --diff-changed-bg: rgba(244, 143, 177, 0.15);
      --diff-mark-bg: #f48fb1;
      --diff-mark-color: #f8c0d0;
      --diff-success-color: #81c784;
      --diff-success-bg: rgba(129, 199, 132, 0.18);''',
    'body.theme-candy': '''      --diff-added-bg: #e8f5e9;
      --diff-removed-bg: #ffebee;
      --diff-changed-bg: #fce4ec;
      --diff-mark-bg: #f4a0c8;
      --diff-mark-color: #3a2050;
      --diff-success-color: #d060a0;
      --diff-success-bg: #f8e0f0;''',
    'body.theme-aurora': '''      --diff-added-bg: rgba(52, 211, 153, 0.15);
      --diff-removed-bg: rgba(239, 68, 68, 0.15);
      --diff-changed-bg: rgba(96, 165, 250, 0.12);
      --diff-mark-bg: #34d399;
      --diff-mark-color: #e4e8f0;
      --diff-success-color: #34d399;
      --diff-success-bg: rgba(52, 211, 153, 0.15);''',
    'body.theme-synthwave': '''      --diff-added-bg: rgba(122, 162, 247, 0.15);
      --diff-removed-bg: rgba(247, 118, 142, 0.15);
      --diff-changed-bg: rgba(187, 154, 247, 0.12);
      --diff-mark-bg: #bb9af7;
      --diff-mark-color: #c0caf5;
      --diff-success-color: #7aa2f7;
      --diff-success-bg: rgba(122, 162, 247, 0.15);''',
    'body.theme-minimal': '''      --diff-added-bg: #e8f5e9;
      --diff-removed-bg: #ffebee;
      --diff-changed-bg: #fff8e1;
      --diff-mark-bg: #1a1a1a;
      --diff-mark-color: #ffffff;
      --diff-success-color: #333333;
      --diff-success-bg: #f0f0f0;''',
    'body.theme-wispr': '''      --diff-added-bg: #e8f5e9;
      --diff-removed-bg: #ffebee;
      --diff-changed-bg: #fff8e1;
      --diff-mark-bg: #1a342d;
      --diff-mark-color: #1a1a1a;
      --diff-success-color: #2a4a3d;
      --diff-success-bg: #e5e4da;''',
    'body.theme-solarized-osaka': '''      --diff-added-bg: rgba(42, 161, 152, 0.15);
      --diff-removed-bg: rgba(220, 50, 47, 0.15);
      --diff-changed-bg: rgba(38, 139, 210, 0.12);
      --diff-mark-bg: #2aa198;
      --diff-mark-color: #fdf6e3;
      --diff-success-color: #2aa198;
      --diff-success-bg: rgba(42, 161, 152, 0.15);''',
    'body.theme-olivia': '''      --diff-added-bg: rgba(163, 190, 140, 0.15);
      --diff-removed-bg: rgba(192, 88, 88, 0.15);
      --diff-changed-bg: rgba(203, 166, 148, 0.12);
      --diff-mark-bg: #cba694;
      --diff-mark-color: #e8c4a8;
      --diff-success-color: #a98e82;
      --diff-success-bg: rgba(163, 190, 140, 0.15);''',
    'body.theme-codex': '''      --diff-added-bg: rgba(66, 211, 146, 0.15);
      --diff-removed-bg: rgba(255, 107, 107, 0.15);
      --diff-changed-bg: rgba(76, 201, 240, 0.12);
      --diff-mark-bg: #42d392;
      --diff-mark-color: #d7e0ea;
      --diff-success-color: #42d392;
      --diff-success-bg: rgba(66, 211, 146, 0.15);''',
}

# Regex to find theme blocks (including :root)
# Matches :root { ... } and body.theme-xxx { ... }
# We need to be careful not to match nested braces, but CSS blocks here are flat

def process_css(text):
    # Pattern to match theme blocks
    pattern = re.compile(r'((?:^    :root|    body\.theme-[^ ]+)(?:\s*\{))([^}]*?)(\})', re.MULTILINE)
    
    def replacer(match):
        header = match.group(1)
        body = match.group(2)
        closing = match.group(3)
        
        # Determine the selector name
        selector = header.strip().split('{')[0].strip()
        
        # Check if diff vars already exist
        if '--diff-added-bg' in body:
            # Already has diff vars, skip (or we could replace them)
            return match.group(0)
        
        if selector in diff_vars:
            vars_to_add = diff_vars[selector]
            # Insert before the closing brace
            # Find the last line before closing, add newline + vars
            new_body = body.rstrip() + '\n' + vars_to_add + '\n    '
            return header + new_body + closing
        
        return match.group(0)
    
    return pattern.sub(replacer, text)

new_content = process_css(content)

with open(css_path, 'w') as f:
    f.write(new_content)

# Verify we added to all expected themes
missing = []
for selector in diff_vars:
    search_key = selector + ' {'
    idx = new_content.find(search_key)
    if idx == -1:
        missing.append(selector)
        continue
    block_start = idx
    block_end = new_content.find('}', block_start)
    block = new_content[block_start:block_end+1]
    if '--diff-added-bg' not in block:
        missing.append(selector)

if missing:
    print(f"Missing or failed for: {missing}")
else:
    print("All diff variables added successfully!")

# Count how many theme blocks now have diff vars
count = len(re.findall(r'--diff-added-bg', new_content))
print(f"Total theme blocks with diff vars: {count}")
