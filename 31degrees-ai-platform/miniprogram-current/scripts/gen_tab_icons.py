# -*- coding: utf-8 -*-
"""生成 31度AI定制小程序 tab 图标（81x81 PNG，透明背景，圆润线条）。

覆盖输出：
    src/static/images/tab-template.png         四角星/闪光 · 灰 #9A9FAE
    src/static/images/tab-template-active.png  四角星/闪光 · 主题红 #FF4D3F
    src/static/images/tab-my.png               人形轮廓 · 灰 #9A9FAE
    src/static/images/tab-my-active.png        人形 · 主题红 #FF4D3F

用法（工程根目录下）：
    G:\\deepseekh\\omniparser-venv\\Scripts\\python.exe scripts/gen_tab_icons.py
"""
import os

from PIL import Image, ImageDraw

SIZE = 81                # 最终输出尺寸
SCALE = 4                # 超采样倍数，保证圆润抗锯齿
CANVAS = SIZE * SCALE    # 324

RED = (255, 77, 63, 255)     # #FF4D3F
GRAY = (154, 159, 174, 255)  # #9A9FAE

OUT_DIR = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "static", "images")
)


def new_canvas():
    img = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def downsample(img):
    return img.resize((SIZE, SIZE), Image.LANCZOS)


def draw_sparkle(color):
    """四角星 / 闪光：八顶点凹角星，顶点用圆头收边，形成圆润线条。"""
    img, d = new_canvas()
    cx = cy = CANVAS // 2
    r_outer = 116          # 四角外半径
    r_inner = 46           # 凹腰内半径
    tip_r = 24             # 外顶点圆头半径
    waist_r = 15           # 凹腰圆角半径

    pts = [
        (cx, cy - r_outer),          # 上
        (cx + r_inner, cy - r_inner),  # 右上凹腰
        (cx + r_outer, cy),          # 右
        (cx + r_inner, cy + r_inner),  # 右下凹腰
        (cx, cy + r_outer),          # 下
        (cx - r_inner, cy + r_inner),  # 左下凹腰
        (cx - r_outer, cy),          # 左
        (cx - r_inner, cy - r_inner),  # 左上凹腰
    ]
    d.polygon(pts, fill=color)
    for (x, y) in pts[::2]:  # 外顶点
        d.ellipse([x - tip_r, y - tip_r, x + tip_r, y + tip_r], fill=color)
    for (x, y) in pts[1::2]:  # 凹腰
        d.ellipse([x - waist_r, y - waist_r, x + waist_r, y + waist_r], fill=color)
    return downsample(img)


def draw_person(color):
    """人形轮廓：圆头 + 圆角肩胸，简洁饱满。"""
    img, d = new_canvas()
    cx = CANVAS // 2
    # 头部
    head_r = 48
    d.ellipse([cx - head_r, 76, cx + head_r, 172], fill=color)
    # 肩胸（圆角，底部略收）
    d.rounded_rectangle([cx - 76, 178, cx + 76, 264], radius=32, fill=color)
    return downsample(img)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    targets = {
        "tab-template.png": draw_sparkle(GRAY),
        "tab-template-active.png": draw_sparkle(RED),
        "tab-my.png": draw_person(GRAY),
        "tab-my-active.png": draw_person(RED),
    }
    for name, img in targets.items():
        path = os.path.join(OUT_DIR, name)
        img.save(path, "PNG")
        print("written %s %dx%d" % (path, img.size[0], img.size[1]))
    print("done: 4 icons")


if __name__ == "__main__":
    main()
