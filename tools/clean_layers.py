#!/usr/bin/env python3
"""Dọn ảnh layer trang phục (PNG/WebP nền trong suốt) rồi xuất WebP nhẹ cho docs/img/items/.

Vì sao cần: ảnh AI sau khi tách nền thường còn
  - các mảnh vụn li ti (vd. nét viền chân/bàn chân còn sót lại trong ảnh áo),
  - vùng mờ gần như trong suốt (vd. vệt đen ở chỗ đầu), làm tối avatar khi chồng lên body,
  - dung lượng rất lớn (PNG ~450 KB/ảnh; WebP cùng chất lượng thường < 60 KB).

Cách dùng (cần: pip install pillow numpy scipy):
  python tools/clean_layers.py <thư_mục_ảnh_gốc> <thư_mục_xuất>   # vd. ảnh gốc ở ~/art -> docs/img/items
  python tools/clean_layers.py ~/art docs/img/items --dry-run      # chỉ báo cáo, không ghi file

Layer áo/quần/giày KHÔNG được chứa đầu người mẫu (hoa tai, tóc...): tool tự xoá phía trên cằm (--clear-above).
Quy tắc: mọi layer PHẢI cùng khung 400x1200 với body (để chồng khít). Ảnh sai khung bị từ chối.
"""
import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

CANVAS = (400, 1200)


def clean(img, alpha_cut, min_frac, min_abs, clear_above=0):
    px = np.array(img.convert('RGBA'))
    alpha = px[:, :, 3]
    if clear_above:
        alpha[:clear_above, :] = 0                     # đầu/tóc/hoa tai của người mẫu lọt vào layer áo
    faint = int(((alpha > 0) & (alpha < alpha_cut)).sum())
    alpha[alpha < alpha_cut] = 0                       # bỏ vùng gần như trong suốt

    mask = alpha > 0
    labels, n = ndi.label(mask, structure=np.ones((3, 3)))   # nối cả đường chéo
    removed = 0
    if n:
        sizes = ndi.sum(mask, labels, range(1, n + 1))
        # Mảnh nhỏ hơn ngưỡng = rác. Ngưỡng tương đối theo kích thước layer để không xoá nhầm
        # chi tiết thật của món nhỏ (vòng tay, giày) mà vẫn quét sạch vụn ở áo/váy.
        threshold = min(min_abs, max(25, min_frac * mask.sum()))
        drop = np.where(sizes < threshold)[0] + 1
        if len(drop):
            alpha[np.isin(labels, drop)] = 0
            removed = len(drop)

    px[:, :, 3] = alpha
    px[alpha == 0, :3] = 0                             # RGB của pixel trong suốt -> 0 (nén tốt, không ngả viền)
    return Image.fromarray(px, 'RGBA'), removed, faint


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('src', type=Path)
    ap.add_argument('dst', type=Path)
    ap.add_argument('--alpha-cut', type=int, default=32, help='alpha dưới mức này coi là trong suốt (mặc định 32)')
    ap.add_argument('--min-frac', type=float, default=0.005, help='mảnh nhỏ hơn tỉ lệ này so với tổng diện tích layer bị xoá (mặc định 0.5%%)')
    ap.add_argument('--min-abs', type=int, default=800, help='trần của ngưỡng trên, tính bằng pixel (mặc định 800)')
    ap.add_argument('--clear-above', type=int, default=222,
                    help='xoá mọi pixel phía trên dòng y này (px trong khung 1200; mặc định 222 ≈ ngang cằm). '
                         'Bỏ qua file hat_* và body*. Đặt 0 để tắt.')
    ap.add_argument('--quality', type=int, default=92)
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    files = sorted(p for p in args.src.iterdir() if p.suffix.lower() in ('.png', '.webp'))
    if not files:
        sys.exit(f'Không có ảnh .png/.webp trong {args.src}')
    if not args.dry_run:
        args.dst.mkdir(parents=True, exist_ok=True)

    bad = 0
    for f in files:
        img = Image.open(f)
        if img.size != CANVAS:
            print(f'✗ {f.name}: khung {img.size[0]}x{img.size[1]}, cần {CANVAS[0]}x{CANVAS[1]} – bỏ qua')
            bad += 1
            continue
        keep_head = f.stem.startswith(('hat_', 'body'))
        out, removed, faint = clean(img, args.alpha_cut, args.min_frac, args.min_abs, 0 if keep_head else args.clear_above)
        target = args.dst / (f.stem + '.webp')
        msg = f'✓ {f.name}: xoá {removed} mảnh vụn, {faint} px mờ'
        if not args.dry_run:
            out.save(target, 'WEBP', quality=args.quality, method=6, exact=True)
            msg += f' | {f.stat().st_size // 1024} KB -> {target.stat().st_size // 1024} KB'
        print(msg)
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
