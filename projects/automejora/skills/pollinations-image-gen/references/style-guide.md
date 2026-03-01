# Complete Style Guide for Pollinations.ai / FLUX.2 klein

Based on FLUX.2 [klein] 4B prompt engineering documentation.

## Core Technical Parameters

- **Step Count:** Hard limit of 4–6 steps (fixed, don't modify)
- **Guidance (CFG):** Strictly 1.0 (fixed, don't modify)
- **Negative Prompting:** Prohibited - use descriptive exclusion instead
- **Text Rendering:** Place specific text in "Double Quotes"

## Pixel Art Specializations

### Classic Retro (8/16-Bit)
Use these keywords:
- `integer scaling`
- `hand-placed pixels`
- `dithered shading`
- `sharp aliased edges`
- `limited palette`
- `8-bit style`
- `16-bit style`
- `NES aesthetic` or `SNES aesthetic`

### Modern Pixel (Hi-Bit/HD)
Use these keywords:
- `volumetric lighting`
- `bloom`
- `sub-pixel rendering`
- `ray-traced shadows`
- `3D parallax depth`
- `cinematic color grading`
- `high-bit color depth`
- `modern pixel art`

## Extended Visual Style Library

Use specific "Medium Keywords" to bypass default photorealism:

| Style Category | Key Technical Descriptors |
|----------------|---------------------------|
| **Hyper-Realistic** | `35mm lens`, `f/1.8`, `cinematic grain`, `skin pores`, `RAW photo`, `global illumination`, `8k resolution` |
| **Vector Illustration** | `flat 2D vector`, `thick outlines`, `minimalist shapes`, `Adobe Illustrator style`, `solid color fills` |
| **Cyberpunk/Synthwave** | `neon signage`, `chromatic aberration`, `retro-futurism`, `teal and orange palette`, `wet pavement` |
| **Traditional Media** | `charcoal sketch`, `heavy impasto oil paint`, `visible brushstrokes`, `watercolor bleeding`, `canvas texture` |
| **Studio Ghibli/Anime** | `hand-painted background`, `cel-shading`, `nostalgic atmosphere`, `soft summer lighting`, `Gouache style`, `Ghibli style` |
| **Claymation/3D** | `macro photography`, `plasticine texture`, `fingerprints in clay`, `tilt-shift lens`, `Octane Render`, `3D clay model` |
| **Digital Art** | `digital painting`, `glowing effects`, `futuristic`, `cyberpunk aesthetic`, `concept art`, `artstation` |
| **Cinematic** | `cinematic lighting`, `35mm lens`, `dramatic shadows`, `film grain`, `cinematic composition`, `depth of field`, `f/2.8` |
| **Minimalist/Flat** | `flat design`, `minimalist`, `solid colors`, `simple shapes`, `clean lines`, `infographic style` |
| **Oil Painting** | `oil painting`, `heavy impasto`, `visible brushstrokes`, `rich colors`, `canvas texture`, `museum quality` |
| **Watercolor** | `watercolor painting`, `soft edges`, `color bleeding`, `transparent layers`, `paper texture` |
| **Pencil/Charcoal** | `pencil sketch`, `charcoal drawing`, `cross-hatching`, `graphite texture`, `paper grain` |

## Prompt Construction Formula

```
[Subject] + [Action/Pose] + [Medium/Style] + [Technical Specifics] + [Lighting/Color]
```

### Breakdown

1. **Subject**: What is the main focus?
   - Examples: "a sleeping AI entity", "a futuristic cityscape", "an old sailor"

2. **Action/Pose**: What is it doing?
   - Examples: "observing", "standing on a rooftop", "reading a book"

3. **Medium/Style**: How is it rendered?
   - Examples: "digital art", "oil painting", "modern pixel art"

4. **Technical Specifics**: Specific technical descriptors
   - Examples: "volumetric lighting", "sharp aliased edges", "Octane Render"

5. **Lighting/Atmosphere**: Mood and lighting
   - Examples: "dramatic rim lighting", "soft morning light", "dark atmosphere"

## Reference Templates

### Modern Pixel Art
```
a forest shrine at night, fireflies glowing, volumetric god-rays through trees, glowing lanterns, high-bit color depth, soft bloom, modern pixel art style, 400p resolution style
```

### Cinematic Realism
```
an old sailor looking at the sea, close-up portrait, 35mm film, dramatic rim lighting, visible salt-crusted skin, ultra-detailed, depth of field, f/2.8, cinematic grain
```

### Claymation Style
```
a tiny dragon guarding gold coins, claymation style, visible fingerprints in the clay, macro photography, soft studio lighting, vibrant colors, plasticine texture, Octane Render
```

### Digital Art / Cyberpunk
```
a glowing AI core in a dark server room, blue neon lights, digital art, cyberpunk aesthetic, volumetric fog, circuit patterns, futuristic, cinematic lighting
```

### Vector Illustration
```
a minimal tech company logo concept, flat 2D vector, thick outlines, minimalist shapes, Adobe Illustrator style, solid color fills, blue and white color scheme, clean lines
```

### Studio Ghibli Style
```
a peaceful village in the countryside, hand-painted background, cel-shading, nostalgic atmosphere, soft summer lighting, Ghibli style, Studio Ghibli aesthetic, lush green hills
```

## Quality Control Checklist

Before finalizing a prompt, verify:

- [ ] **Guidance Scale:** Model uses CFG=1.0 (fixed, no need to specify)
- [ ] **Concrete Nouns:** Using specific, concrete nouns instead of abstract adjectives
- [ ] **Pixel Art Resolution:** Specified resolution style (e.g., `64x64`, `400p`, `8-bit`)
- [ ] **Text in Quotes:** Any text to be rendered is in "Double Quotes"
- [ ] **No Negative Prompting:** Not using negative prompts (not supported)

## Common Prompt Patterns

### Sci-Fi/Tech
```
{subject}, futuristic, high-tech, glowing circuits, holographic displays, clean surfaces, sci-fi aesthetic, digital art, cinematic lighting, cool blue tones
```

### Fantasy/Magic
```
{subject}, magical effects, glowing particles, ethereal atmosphere, fantasy art, dramatic lighting, warm golden tones, mystical ambiance
```

### Dark/Moody
```
{subject}, dark atmosphere, shadows, dramatic lighting, silhouette, high contrast, moody, cinematic, film noir style
```

### Bright/Cheerful
```
{subject}, bright and cheerful, soft pastel colors, warm sunlight, happy atmosphere, clean and minimal, soft lighting
```

### Technical/Diagram
```
{subject}, technical diagram, flat 2D vector, clean lines, infographic style, labels and arrows, blue and white, educational illustration, schematic
```

## URLs and Encoding

When constructing the curl URL:

1. Replace spaces with `%20`
2. Keep commas and punctuation as-is (usually fine)
3. Use quotes around the entire URL if special characters present
4. Test the encoded prompt:
   ```bash
   # Encode for testing
   echo -n "your prompt here" | python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.stdin.read(), safe=''))"
   ```

## Model Behavior

- **Default:** Tends toward photorealism if no style keywords given
- **Style override:** Medium keywords ("oil painting", "pixel art") shift output style
- **Text:** Can render text if in "quotes", but quality varies
- **Faces:** Generally good with FLUX.2 klein
- **Hands:** Better than older models but not perfect
- **Anatomy:** Generally good unless very complex poses