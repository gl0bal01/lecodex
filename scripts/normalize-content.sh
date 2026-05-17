#!/usr/bin/env bash
# Normalize Docusaurus-style admonitions (:::type[title] ... :::) into Obsidian-style
# callouts (> [!type] title) so Quartz's ObsidianFlavoredMarkdown plugin renders them.
# Idempotent. Safe to run on already-Obsidian-style files.
set -eu

CONTENT_DIR="${1:-content}"

if [ ! -d "$CONTENT_DIR" ]; then
  echo "normalize-content: $CONTENT_DIR not found" >&2
  exit 1
fi

# Strip vestigial "intel-codex/" prefix from wikilinks + markdown links.
# Origin: vault was previously consumed by Docusaurus mounted at /intel-codex/, so
# some [[intel-codex/X]] links were authored. In Quartz (single-instance, baseUrl=/),
# those produce /intel-codex/X 404s. Strip prefix; Quartz markdownLinkResolution:shortest
# resolves the leaf filename regardless of folder.
#
# Also strip leading ../ and ./ from wikilink targets — these are markdown-link syntax,
# not Obsidian wikilink syntax. Quartz misresolves [[../../Security/Analysis/sop-X]]
# to /Analysis/sop-X (drops one segment per .. instead of resolving relative path).
# Stripping the .. and letting Quartz resolve by absolute vault path works.
find "$CONTENT_DIR" -type f -name '*.md' -print0 | xargs -0 sed -i -E \
  -e 's/\[\[intel-codex\//[[/g' \
  -e 's/\]\(intel-codex\//](/g' \
  -e 's/\[\[(\.\.\/)+/[[/g' \
  -e 's/\[\[\.\//[[/g'

# Strip folder prefixes from wikilink targets — basenames are unique across
# non-excluded vault content (verified). [[Folder/Sub/file|alias]] -> [[file|alias]].
# Quartz markdownLinkResolution:shortest then resolves to actual location.
# Without this, [[Techniques/sop-X]] resolves as vault-absolute /Techniques/sop-X
# (404) instead of /Investigations/Techniques/sop-X.
find "$CONTENT_DIR" -type f -name '*.md' -print0 | xargs -0 perl -i -pe 's/\[\[[^\]\|]*\/([^\]\|\/]+)(\|[^\]]*)?\]\]/[[$1$2]]/g'

# Find markdown files containing ::: admonitions, transform line-by-line.
find "$CONTENT_DIR" -type f -name '*.md' -print0 | while IFS= read -r -d '' f; do
  if ! grep -qE '^:::' "$f"; then
    continue
  fi
  awk '
    /^:::(info|note|tip|warning|danger|caution|important|abstract|example|question|success|failure|bug|quote)([\[[:space:]].*)?[[:space:]]*$/ {
      rest = $0
      sub(/^:::/, "", rest)
      # extract type token (alphabetic word at start)
      type = rest
      sub(/[^a-zA-Z].*$/, "", type)
      # strip type from rest -> title source
      title_src = substr(rest, length(type) + 1)
      title = ""
      if (match(title_src, /\[[^]]*\]/)) {
        title = substr(title_src, RSTART+1, RLENGTH-2)
      } else {
        sub(/^[[:space:]]+/, "", title_src)
        sub(/[[:space:]]+$/, "", title_src)
        title = title_src
      }
      if (title == "") {
        print "> [!" type "]"
      } else {
        print "> [!" type "] " title
      }
      in_block = 1
      next
    }
    /^:::[[:space:]]*$/ {
      in_block = 0
      print ""
      next
    }
    {
      if (in_block) {
        print "> " $0
      } else {
        print
      }
    }
  ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
done

echo "normalize-content: done"
