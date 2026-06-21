import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('/mnt/user-uploads/debate-coach-toolkit-v31_3.html', 'utf8');
const lines = html.split('\n');

// helper: extract block by line range (1-indexed inclusive)
const slice = (a, b) => lines.slice(a - 1, b).join('\n');

// MOTIONS: 3800..3880   ends with "];"
// JENIS_MOSI: 3882..3925 ends with "];const vocabData = ["  -> we slice until the line before that
// vocabData: 3925..4051 (line 3925 starts "];const vocabData = [")
// MATTER_DATA: 4767..6759

const motionsSrc = slice(3800, 3880);
const jenisSrc = slice(3882, 3924) + '\n];'; // line 3925 contains the "];" then begins vocabData
// vocabData source: the array literal from line 3925 through 4051. Line 3925 = "];const vocabData = ["
const vocabSrc = 'const vocabData = [' + slice(3926, 4051);
let matterSrc = slice(4767, 6759);

// Robust fix: walk char by char honoring quote/string state.
function escapeStrayApos(src) {
  let out = '';
  let inStr = false;
  let strCh = '';
  let inLineComment = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const prev = src[i - 1] || '';
    const next = src[i + 1] || '';
    if (inLineComment) {
      out += c;
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (!inStr) {
      if (c === '/' && next === '/') { inLineComment = true; out += c; continue; }
      if (c === "'" || c === '"' || c === '`') { inStr = true; strCh = c; out += c; continue; }
      out += c;
      continue;
    }
    // inside string
    if (c === '\\') { out += c + next; i++; continue; }
    if (c === strCh) {
      // Determine if this is the real closing quote or a stray apostrophe inside a single-quoted string.
      if (strCh === "'") {
        // Closing quote heuristic: next char is one of `,`, `;`, `}`, `)`, `]`, `:` (only after key) ,`\n`, end, or whitespace then those.
        let j = i + 1;
        while (j < src.length && (src[j] === ' ' || src[j] === '\t')) j++;
        const after = src[j] || '';
        const closers = [',', ';', '}', ')', ']', '\n', '+', '.', '?'];
        if (closers.includes(after) || j === src.length) {
          inStr = false; out += c; continue;
        } else {
          // stray apostrophe – escape it
          out += "\\'"; continue;
        }
      } else {
        inStr = false; out += c; continue;
      }
    }
    out += c;
  }
  return out;
}
matterSrc = escapeStrayApos(matterSrc);

const sandboxCode = `
${motionsSrc}
${jenisSrc}
${vocabSrc}
${matterSrc}
globalThis.__OUT = { MOTIONS, JENIS_MOSI, vocabData, MATTER_DATA };
`;

const ctx = { globalThis: {} };
vm.createContext(ctx);
try {
  vm.runInContext(sandboxCode, ctx);
} catch (e) {
  console.error('eval failed:', e.message);
  // dump tail of code to debug
  fs.writeFileSync('/tmp/extract-debug.js', sandboxCode);
  process.exit(1);
}

const out = ctx.globalThis.__OUT;
console.log('MOTIONS:', out.MOTIONS.length);
console.log('JENIS_MOSI:', out.JENIS_MOSI.length);
console.log('vocabData:', out.vocabData.length);
console.log('MATTER_DATA domains:', Object.keys(out.MATTER_DATA).length);

// Write each as JSON (later converted to TS modules)
fs.mkdirSync('src/data/raw', { recursive: true });
fs.writeFileSync('src/data/raw/motions.json', JSON.stringify(out.MOTIONS, null, 2));
fs.writeFileSync('src/data/raw/jenis-mosi.json', JSON.stringify(out.JENIS_MOSI, null, 2));
fs.writeFileSync('src/data/raw/vocab.json', JSON.stringify(out.vocabData, null, 2));
fs.writeFileSync('src/data/raw/matter.json', JSON.stringify(out.MATTER_DATA, null, 2));
console.log('wrote src/data/raw/*.json');