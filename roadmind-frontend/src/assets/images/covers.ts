import highway from '@/assets/images/highway-hero.webp'
import pavement from '@/assets/images/cover-pavement.webp'
import bridge from '@/assets/images/cover-bridge.webp'
import safety from '@/assets/images/cover-safety.webp'
import project from '@/assets/images/cover-project.webp'
import type { KnowledgeBase } from '@/types/domain'

/** 素材由 imagegen 生成并压缩，未从 UI 参考图裁切。 */
export const highwayHero = highway
export function knowledgeCover(base: KnowledgeBase): string {
  return base.color === 'teal' ? bridge : base.color === 'orange' ? safety : base.color === 'purple' ? project : pavement
}
