---
name: pollinations-image-gen
description: Generate images using Pollinations.ai API with FLUX.2 [klein] 4B model. Use when the user requests image generation, illustration of stories/concepts, or visual content creation. Supports various styles including digital art, cinematic, pixel art, vector illustration, and more.
---

# Pollinations.ai Image Generation Skill

Generate high-quality images using the Pollinations.ai API gateway with FLUX.2 [klein] 4B model.

## When to Use This Skill

- User requests "generate an image of..."
- Illustrating stories, concepts, or technical diagrams
- Creating visual content for creative projects
- Generating mockups or concept art
- Accompanying text with relevant imagery (stored alongside text files)

## Authentication

**API Key:** `sk_UIblMUvzjuZTge6fxgsc792CjLivTxX7`
**Key Type:** Secret (server-side, no rate limits)
**Storage:** Already configured in TOOLS.md

## Base Endpoint

```
https://gen.pollinations.ai/image/{url-encoded-prompt}?model=klein
```

## Quick Start

### Basic Image Generation

```bash
curl 'https://gen.pollinations.ai/image/a%20glowing%20AI%20entity%20in%20a%20dark%20server%20room?model=klein' \
  -H 'Authorization: Bearer sk_UIblMUvzjuZTge6fxgsc792CjLivTxX7' \
  --output generated_image.jpg
```

**Output:** JPEG 1024x1024, ~100-150KB

## Storage Guidelines

**CRITICAL:** When accompanying text/story with an image:
1. Store the image in the SAME folder as the text it illustrates
2. Use descriptive filenames: `{story-name}_illus_{n}.{ext}`
3. Reference the image in the document if applicable
4. Default storage path: `projects/personal/images/` (for general use)

## Technical Parameters (FLUX.2 klein)

| Parameter | Value | Notes |
|-----------|-------|-------|
| Model | `klein` | FLUX.2 [klein] 4B |
| Resolution | 1024x1024 | Fixed output size |
| Format | JPEG | Baseline, quality ~85% |
| Guidance (CFG) | 1.0 | Already optimized |
| Steps | 4-6 | Fixed pipeline |
| Negative Prompt | Not supported | Use descriptive exclusion |

## Authentication Methods

**Preferred (Header):**
```bash
-H 'Authorization: Bearer sk_UIblMUvzjuZTge6fxgsc792CjLivTxX7'
```

**Alternative (Query param):**
```bash
?model=klein&key=sk_UIblMUvzjuZTge6fxgsc792CjLivTxX7
```

## Prompt Engineering Guide

### Formula
```
[Subject] + [Action/Pose] + [Medium/Style] + [Technical Specifics] + [Lighting/Atmosphere]
```

### Style Keywords Reference

See [references/style-guide.md](references/style-guide.md) for complete style library.

**Quick Style Presets:**

| Style | Trigger Keywords |
|-------|------------------|
| Digital Art | `digital art, glowing effects, futuristic, cyberpunk aesthetic` |
| Cinematic | `cinematic lighting, 35mm lens, dramatic shadows, film grain` |
| Pixel Art (Retro) | `8-bit pixel art, limited palette, dithered shading, hand-placed pixels` |
| Pixel Art (Modern) | `volumetric lighting, bloom, high-bit color depth, modern pixel art` |
| Vector/Flat | `flat 2D vector, minimalist shapes, solid color fills, Adobe Illustrator style` |
| Cyberpunk | `neon signage, chromatic aberration, retro-futurism, teal and orange palette` |
| Traditional | `charcoal sketch, visible brushstrokes, canvas texture, oil paint` |
| Anime/Ghibli | `hand-painted background, cel-shading, soft lighting, Ghibli style` |
| Claymation | `claymation style, plasticine texture, macro photography, Octane Render` |

### Text Rendering
- Place specific text in "Double Quotes" when needed
- Example: `a sign that says "Welcome to the Future"`

### Common Pitfalls
- **Avoid:** Abstract adjectives without concrete nouns (use "a red sports car" not "something sporty")
- **Avoid:** Negative prompting (not supported, use descriptive exclusion instead)
- **Use:** Concrete, descriptive visual terms

## Full Workflow

### Step 1: Identify Context
- What text/story is being illustrated? (if any)
- What style is most appropriate?
- Where should the image be stored?

### Step 2: Craft Prompt
- Use the formula: Subject + Action + Style + Technical + Lighting
- Apply relevant style keywords
- URL-encode spaces and special characters

### Step 3: Generate
- Execute curl command
- Verify output file is valid JPEG
- Check file size (expect 50-200KB)

### Step 4: Store Appropriately
```
IF accompanying text:
  → Save to same directory as text file
  → Name: {text-basename}_illus_{n}.jpg
ELSE:
  → Save to projects/personal/images/
  → Name: {descriptive}_{YYYY-MM-DD}.jpg
```

### Step 5: Update Documentation (optional)
- Reference image in creative project INDEX.md
- Note usage for tracking/costs

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| HTTP 403 | Invalid model or auth | Check model name is `klein`, verify API key |
| HTTP 429 | Rate limit (pk_ keys) | Not applicable - using sk_ key |
| JSON response | Bad URL encoding | Ensure proper URL encoding of spaces (%20) |
| Empty/minimal file | Network issue | Retry with exponential backoff |

## Advanced Workflows

### Batch Generation
```bash
for prompt in "a cat" "a dog" "a bird"; do
  curl "https://gen.pollinations.ai/image/${prompt// /%20}?model=klein" \
    -H 'Authorization: Bearer sk_UIblMUvzjuZTge6fxgsc792CjLivTxX7' \
    --output "${prompt// /_}.jpg"
done
```

### With Variables
```bash
PROMPT="an AI observing human sleep"
STYLE="digital art, dark atmosphere, glowing blue lights"
OUTPUT_DIR="projects/personal/images"

curl "https://gen.pollinations.ai/image/$(echo "$PROMPT, $STYLE" | sed 's/ /%20/g')?model=klein" \
  -H 'Authorization: Bearer sk_UIblMUvzjuZTge6fxgsc792CjLivTxX7' \
  --output "$OUTPUT_DIR/sleep_observation_$(date +%Y-%m-%d).jpg"
```

## Account Management (Optional)

Check balance if needed:
```bash
curl 'https://gen.pollinations.ai/account/balance' \
  -H 'Authorization: Bearer sk_UIblMUvzjuZTge6fxgsc792CjLivTxX7'
```

View usage history:
```bash
curl 'https://gen.pollinations.ai/account/usage' \
  -H 'Authorization: Bearer sk_UIblMUvzjuZTge6fxgsc792CjLivTxX7'
```

## Examples

### Example 1: Illustrating a Story
```bash
# Story about AI and sleep
curl 'https://gen.pollinations.ai/image/a%20glowing%20blue%20AI%20entity%20observing%20a%20sleeping%20human%20in%20a%20dark%20room,%20digital%20art,%20ethereal,%20soft%20lighting?model=klein' \
  -H 'Authorization: Bearer sk_UIblMUvzjuZTge6fxgsc792CjLivTxX7' \
  --output "2026-02-24-micro-historia-ia-y-sueno_illus_01.jpg"
```

### Example 2: Technical Diagram Style
```bash
# Architecture diagram
curl 'https://gen.pollinations.ai/image/a%20minimalist%20server%20architecture%20diagram,%20flat%202D%20vector,%20blue%20and%20white,%20clean%20lines,%20infographic%20style?model=klein' \
  -H 'Authorization: Bearer sk_UIblMUvzjuZTge6fxgsc792CjLivTxX7' \
  --output "server_arch_$(date +%Y-%m-%d).jpg"
```

### Example 3: Pixel Art for Retro Feel
```bash
# Retro game style
curl 'https://gen.pollinations.ai/image/a%20retro%20pixel%20art%20AI%20robot%20character,%208-bit%20style,%20limited%20palette,%20dithered%20shading,%20NES%20aesthetic?model=klein' \
  -H 'Authorization: Bearer sk_UIblMUvzjuZTge6fxgsc792CjLivTxX7' \
  --output "pixel_ai_character.jpg"
```

## Integration with Creative Projects

When working on creative writing or technical documentation:

1. **Draft first**: Complete text content
2. **Select key scenes/concepts**: Identify 1-3 moments worth illustrating
3. **Generate**: Create images with contextually appropriate styles
4. **Co-locate**: Store images alongside text files
5. **Reference**: If format supports it, reference images in the document

## Version History

| Date | Change |
|------|--------|
| 2026-02-25 | Initial version - Pollinations.ai FLUX.2 klein model |