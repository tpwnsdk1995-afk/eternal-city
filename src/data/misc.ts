import type { MiscDef } from './schema/item';
import { TEX } from './textureKeys';

export const MISC: MiscDef[] = [
  {
    kind: 'misc',
    id: 'wito_dispatch_doc',
    name: '위토군 배치문서',
    desc: 'W.I.T.O 병사가 지니고 있던 부대 배치 문서. 김훈 소대장이 찾고 있다.',
    weightKg: 0.1,
    price: 0,
    quest: true,
    iconTex: TEX.icon_document,
  },
];
