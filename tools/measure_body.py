#!/usr/bin/env python3
"""In bảng bề ngang của ảnh body tham chiếu theo từng độ cao, để hiệu chỉnh ART_REF trong docs/js/avatar.js.

ART_REF gồm các mốc cơ thể (cổ, vai, ngực, eo, hông, đáy quần, gối, cổ chân, gót chân) trên ảnh body, đơn vị 200x600.
Avatar dùng chúng để kéo ảnh đồ cho khớp thân vector. Nếu bạn đổi art/reference/body.webp (hoặc vẽ lại tỉ lệ),
chạy tool này rồi cập nhật ART_REF cho khớp:
  - y  = độ cao của mốc (cột đầu tiên khi bề ngang thân thay đổi: eo = hẹp nhất, hông = rộng nhất, "tách đôi" = đáy quần...)
  - hw = nửa bề ngang tại mốc đó (cột "nửa rộng"; phần trên tính cả tay, phần dưới tính cả hai chân)

Cách dùng (cần: pip install pillow numpy):   python tools/measure_body.py [art/reference/body.webp] [bước=15]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

path = Path(sys.argv[1] if len(sys.argv) > 1 else 'art/reference/body.webp')
step = int(sys.argv[2]) if len(sys.argv) > 2 else 15
alpha = np.array(Image.open(path).convert('RGBA'))[:, :, 3] > 40
h, w = alpha.shape
sx, sy = 200 / w, 600 / h                                  # về đơn vị 200x600


def runs(row):
    xs = np.where(row)[0]
    if not len(xs):
        return []
    out, start, prev = [], xs[0], xs[0]
    for x in xs[1:]:
        if x != prev + 1:
            out.append((start, prev)); start = x
        prev = x
    out.append((start, prev))
    return out


ys = np.where(alpha.any(axis=1))[0]
print(f'{path}: {w}x{h}px, cao từ y={ys[0] * sy:.0f} đến y={ys[-1] * sy:.0f} (đơn vị 200x600)\n')
print(f'{"y":>5}  {"nửa rộng":>8}  các đoạn x (>1 đoạn = tay/chân tách khỏi thân)')
for y in range(int(ys[0] * sy), int(ys[-1] * sy), step):
    r = runs(alpha[int(y / sy)])
    if r:
        total = (r[-1][1] - r[0][0] + 1) * sx / 2
        print(f'{y:5d}  {total:8.1f}  ' + ' '.join(f'{a * sx:.0f}-{b * sx:.0f}' for a, b in r))
