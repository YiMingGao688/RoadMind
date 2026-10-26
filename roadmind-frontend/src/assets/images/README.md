# RoadMind 交通视觉素材

本轮六页界面使用内置 **imagegen 工具**生成的写实交通素材，已复制到本工程并编码为 WebP。没有从 UI 参考图裁取素材，没有使用外部图库图片；功能图标仍为 Lucide SVG。

| 文件 | 尺寸 | 字节数 | 使用位置 |
| --- | --- | ---: | --- |
| `highway-hero.webp` | 1440×810 | 164,908 | 首页与养护助手的道路/桥梁背景 |
| `cover-pavement.webp` | 420×280 | 38,558 | 路面知识库 |
| `cover-bridge.webp` | 420×280 | 38,496 | 桥涵与排水知识库 |
| `cover-safety.webp` | 420×280 | 40,214 | 应急安全知识库 |
| `cover-project.webp` | 420×280 | 30,816 | 巡查案例知识库 |

封面分别取自生成照片的对应场景区域，再做尺寸与 WebP 编码优化；五份在用素材合计 **312,992 字节**。两张原始生成图保留在本机 Codex 生成目录中，项目不依赖该目录。

原图标识：

- 道路/桥梁：`exec-93f23bfc-ae44-439a-b653-cfa3074a6358.png`
- 养护工程：`exec-a0c075be-0be6-49fb-bd9a-720275596c9b.png`

## 生成提示规格

以下记录本轮提示词的主题、布局与限制，便于后续生成同风格素材；它们不是实景交通工程的现场照片。

**道路与桥梁 / photorealistic-natural**

> A realistic professional editorial photograph for a highway knowledge application. An elegant curving mountain highway connected to a long concrete viaduct, calm green mountain slopes, natural daylight and a pale blue sky. Wide landscape composition with the road and bridge clearly readable on the right, and quiet bright sky and atmospheric landscape on the left for interface copy. Restrained natural color with slate blue and green, realistic civil engineering details and clean road markings. No text, no logos, no watermark, no UI, no neon, no cyberpunk, no plastic 3D, no drones or hardware control imagery.

**养护工程 / photorealistic-natural**

> A realistic professional editorial photograph of highway pavement maintenance in a calm green mountain landscape. Orange traffic safety cones in the left foreground and a yellow road roller on the right, freshly maintained asphalt and natural road textures, clear natural daylight. Balanced wide landscape framing suitable for separate knowledge library cover crops. Match the restrained natural colors and visual quality of the highway and bridge image. No text, no logos, no watermark, no UI elements, no exaggerated 3D, no glowing technology lines, no drones.

## 上轮保留素材

`road-bridge-illustration.webp`（640×427，44,618 字节）为上一轮生成的透明品牌插画，本轮六页没有引用。为保留已有文件未删除它，也未把它用作功能性图标。