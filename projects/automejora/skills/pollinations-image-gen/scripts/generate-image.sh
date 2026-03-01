#!/bin/bash
#
# Pollinations.ai Image Generator Script
# Generates images using FLUX.2 [klein] 4B model via Pollinations.ai API
#
# Usage: ./generate-image.sh "your prompt here" /output/path/image.jpg

set -e

API_KEY="sk_UIblMUvzjuZTge6fxgsc792CjLivTxX7"
MODEL="klein"
ENDPOINT="https://gen.pollinations.ai/image"

# Check arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 \"your prompt here\" /output/path/image.jpg"
    echo ""
    echo "Examples:"
    echo "  $0 \"a cat sleeping\" ./cat.jpg"
    echo "  $0 \"digital art of AI, cyberpunk style\" ./ai_art.jpg"
    exit 1
fi

PROMPT="$1"
OUTPUT_PATH="$2"

# URL encode the prompt
URL_ENCODED_PROMPT=$(echo -n "$PROMPT" | python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.stdin.read(), safe=''))" 2>/dev/null || echo -n "$PROMPT" | sed 's/ /%20/g')

# Create output directory if needed
mkdir -p "$(dirname "$OUTPUT_PATH")"

echo "Generating image..."
echo "Prompt: $PROMPT"
echo "Output: $OUTPUT_PATH"
echo ""

# Execute curl request
curl -s "${ENDPOINT}/${URL_ENCODED_PROMPT}?model=${MODEL}" \
    -H "Authorization: Bearer ${API_KEY}" \
    --output "$OUTPUT_PATH" \
    --fail-with-body || {
        echo "Error: Request failed"
        exit 1
    }

# Verify output is valid image
if file "$OUTPUT_PATH" | grep -q "JPEG\|JPG"; then
    FILE_SIZE=$(du -h "$OUTPUT_PATH" | cut -f1)
    echo ""
    echo "✓ Success! Image saved to: $OUTPUT_PATH"
    echo "  Size: $FILE_SIZE"
    file "$OUTPUT_PATH"
else
    echo ""
    echo "⚠ Warning: Output may not be a valid JPEG"
    echo "  Content:"
    head -c 500 "$OUTPUT_PATH"
    echo ""
    exit 1
fi