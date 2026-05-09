#!/usr/bin/env python3
"""
Method Studio Archive Artifact v3
Clean, sprite-based Design Methods Clockwork with proper collision/jamming logic.

Features:
- Uses gear sprite sheet for visual variety (16 styles)
- Clean white background
- Proper Gear class (no more bloated dicts)
- Collision detection starts from clock → reverse direction on conflict → back-propagate → jam if needed
- Functional debug mode (press D)
- Much cleaner and maintainable code
"""

import pygame
import math
import sys
from collections import deque, namedtuple
from dataclasses import dataclass, field
from pathlib import Path
import numpy as np

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("[WARNING] Pillow not installed → sprite sheet disabled.")
    print("          Install with: pip install Pillow   (NOT 'pip install PIL')")

# ====================== CONFIG ======================
WIDTH, HEIGHT = 1400, 920
FPS = 60
SPRITE_SHEET_PATH = Path(__file__).parent / "gear_spritesheet.png"

# ====================== GEAR SPRITE SHEET PROCESSING ======================

def load_and_process_spritesheet(path: Path):
    """
    Load sprite sheet (assumes 4x4 grid), remove white background,
    center each gear nicely, and return list of 16 clean Pygame surfaces.
    """
    if not PIL_AVAILABLE:
        return None
    if not path.exists():
        print(f"[INFO] Sprite sheet not found at {path}. Using procedural gears only.")
        return None

    img = Image.open(path).convert("RGBA")
    w, h = img.size

    # === GRID SIZE IS SET HERE ===
    # We assume a 4x4 layout. Tile size is calculated automatically.
    GRID_COLS = 4
    GRID_ROWS = 4
    tile_w = w // GRID_COLS
    tile_h = h // GRID_ROWS
    # =================================

    # Remove white / near-white background → make transparent
    pixels = img.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if r > 235 and g > 235 and b > 235:
                pixels[x, y] = (255, 255, 255, 0)

    sprites = []
    for row in range(GRID_ROWS):
        for col in range(GRID_COLS):
            left = col * tile_w
            top = row * tile_h

            # Crop the full tile first
            tile = img.crop((left, top, left + tile_w, top + tile_h))

            # === CENTERING IMPROVEMENT ===
            # Find the bounding box of the actual gear (non-transparent content)
            bbox = tile.getbbox()
            if bbox:
                # Add a little padding around the gear for nicer look
                padding = 4
                left_pad   = max(0, bbox[0] - padding)
                top_pad    = max(0, bbox[1] - padding)
                right_pad  = min(tile_w, bbox[2] + padding)
                bottom_pad = min(tile_h, bbox[3] + padding)
                centered_tile = tile.crop((left_pad, top_pad, right_pad, bottom_pad))
            else:
                centered_tile = tile
            # =================================

            # Resize to target size used in the simulation
            final = centered_tile.resize((88, 88), Image.LANCZOS)
            surf = pygame.image.fromstring(final.tobytes(), final.size, final.mode)
            sprites.append(surf.convert_alpha())

    print(f"[INFO] Loaded {len(sprites)} centered gear sprites from {path.name}")
    return sprites


# ====================== DATA ======================

@dataclass
class Gear:
    x: float
    y: float
    radius: float
    num_teeth: int
    key: str
    label: str
    full: str
    phase: str
    desc: str
    insight: str
    layer: int
    color: tuple
    is_internal: bool = False
    alpha: float = 20.0
    beta: float = 0.0
    angle: float = 0.0
    omega: float = 0.0
    visible: bool = True
    sprite_idx: int = 0          # which sprite from sheet to use
    conflict: bool = False       # for debug visualization


# ====================== METHOD DATABASE ======================

METHODS = {
    # Phase 1
    "AEIOU":    {"full": "AEIOU Observation",          "phase": "Phase 1",       "desc": "Systematic observation framework.", "insight": "Grounded opportunity map in student voices."},
    "FOTW":     {"full": "Fly-on-the-Wall",            "phase": "Phase 1",       "desc": "Neutral real-time observation.", "insight": "Shows unfiltered behaviors."},
    "INTVW":    {"full": "Stakeholder Interviews",     "phase": "Phase 1 & 2",   "desc": "Turns raw data into insights and HMWs.", "insight": "Revealed credit stress and manual bottlenecks."},
    "ASSUMPT":  {"full": "Assumption Mapping",         "phase": "Phase 1",       "desc": "Ranks beliefs to make biases visible and testable.", "insight": "Revealed high-risk assumptions about independence vs preparedness."},
    "OPPMAP":   {"full": "Opportunity Mapping",        "phase": "Phase 1",       "desc": "Synthesizes observations into opportunity areas and tensions.", "insight": "Mapped recurring tensions in social integration and academic readiness."},
    # Phase 2
    "INSIGHT":  {"full": "Insight Statements",         "phase": "Phase 2",       "desc": "Bridges observation to framing.", "insight": "Made tension between excitement and process visible."},
    "HMW":      {"full": "How-Might-We Questions",     "phase": "Phase 2",       "desc": "Generative questions that shift responsibility.", "insight": "Different HMWs open different solution spaces."},
    "JMAP":     {"full": "Journey Mapping",            "phase": "Phase 2",       "desc": "Visualizes end-to-end experience and handoffs.", "insight": "Exposed manual syllabus comparison bottleneck."},
    "STAKE":    {"full": "Stakeholder Mapping",        "phase": "Phase 2",       "desc": "Identifies all stakeholders to prevent single-perspective conclusions.", "insight": "Exposed communication gaps between offices, departments, and students."},
    "BOUND":    {"full": "Boundary Definition",        "phase": "Phase 2 & 4",   "desc": "Explicitly defines what is in and out of scope.", "insight": "Clarified short-term visibility vs long-term retention."},
    # Phase 3 - Divergent Ideation (many methods)
    "C8":       {"full": "Crazy 8s",                   "phase": "Phase 3",       "desc": "Rapid divergent sketching.", "insight": "Breadth before depth; ridiculous ideas sparked good ones."},
    "WORST":    {"full": "Worst Possible Ideas",       "phase": "Phase 3",       "desc": "Deliberately bad ideas to break assumptions and spark creativity.", "insight": "Terrible ideas often contained the seeds of the best solutions."},
    "INITIDEA": {"full": "Initial Ideas",              "phase": "Phase 3",       "desc": "Quick generation of raw concepts without judgment.", "insight": "Volume and variety in the first pass led to stronger later concepts."},
    "COMBINE":  {"full": "Combined Ideas",             "phase": "Phase 3",       "desc": "Merging multiple concepts to create hybrid solutions.", "insight": "Unexpected combinations produced the most novel directions."},
    "SCAMPER":  {"full": "SCAMPER",                    "phase": "Phase 3",       "desc": "Structured provocation on existing elements.", "insight": "Unexpected directions emerged from provocation."},
    "CONCSKETCH":{"full": "Concept Sketches",          "phase": "Phase 3",       "desc": "Quick visual exploration of form and interaction.", "insight": "Drawing made spatial and ergonomic issues visible early."},
    "STORY":    {"full": "Storyboarding",              "phase": "Phase 3",       "desc": "Makes experiences legible for comparison and refinement.", "insight": "Strong concepts combine activity + optional signal."},
    "PROTO":    {"full": "Prototyping",                "phase": "Phase 3",       "desc": "Low-fidelity making to test assumptions quickly.", "insight": "Making revealed feasibility issues that sketches missed."},
    # Phase 4
    "SVCBLUE":  {"full": "Service Blueprint",          "phase": "Phase 4",       "desc": "Maps the full service journey and backstage processes.", "insight": "Made invisible support processes and failure points visible."},
    "FUNCREQ":  {"full": "Functional Requirements",    "phase": "Phase 4",       "desc": "Defines what the solution must do.", "insight": "Clarified must-have vs nice-to-have features."},
    "SPECHYP":  {"full": "Specification-as-Hypothesis","phase": "Phase 4",       "desc": "Makes claims falsifiable and testable.", "insight": "Turned vague intent into measurable hypotheses."},
    "VERVAL":   {"full": "Verification as Validation", "phase": "Phase 4",       "desc": "Checks that the design meets its own specifications.", "insight": "Early verification caught critical mismatches before building."},
    "RACI":     {"full": "RACI Table",                 "phase": "Phase 4",       "desc": "Clarifies roles: Responsible, Accountable, Consulted, Informed.", "insight": "Removed ambiguity about who owns each part of the project."},
    "FMEA":     {"full": "FMEA",                       "phase": "Phase 4 & 5",   "desc": "Quantifies risk with RPN scores.", "insight": "Prioritized where to add durability and feedback."},
    # Phase 5 - Evaluation & Testing (many methods)
    "EVALPLAN": {"full": "Evaluation Plan",            "phase": "Phase 5",       "desc": "Defines criteria, methods, and success metrics upfront.", "insight": "Clear plan kept testing focused and comparable across iterations."},
    "SPECTABLE": {"full": "Specification Table",       "phase": "Phase 5",       "desc": "Organizes requirements with measurable targets.", "insight": "Made it obvious which specs were met or needed iteration."},
    "DECREC":   {"full": "Decision Recommendation",    "phase": "Phase 5",       "desc": "Synthesizes evidence into a clear go / pivot / stop call.", "insight": "Evidence strongly supported proceeding with refinements."},
    "KEYFIND":  {"full": "Key Findings",               "phase": "Phase 5",       "desc": "Distills the most important patterns and surprises from testing.", "insight": "Hinge tilt and rubber feet dust collection were critical usability issues."},
    "LIMMEMO":  {"full": "Limitations Memo",           "phase": "Phase 5",       "desc": "Explicitly documents what the evaluation did not cover.", "insight": "Long-term durability and wider user diversity remain untested."},
    "TBT":      {"full": "Task-Based Testing",         "phase": "Phase 5",       "desc": "Measures real performance on representative tasks.", "insight": "Revealed conditional stability on weight and surface; setup averaged ~6s."},
    "TRADE":    {"full": "Trade-off Analysis",         "phase": "Phase 5",       "desc": "Makes inherent compromises visible.", "insight": "Weighed stability vs speed vs adjustability; 3x stable claim holds up to ~5.5 lb."},
    "COMPARE":  {"full": "Comparative Testing",        "phase": "Phase 5",       "desc": "Side-by-side evaluation against alternatives or benchmarks.", "insight": "Direct comparison highlighted clear advantages in adjustability."},
    "EDGECASE": {"full": "Edge Case Testing",          "phase": "Phase 5",       "desc": "Probes extreme conditions and model simulation.", "insight": "Extreme angles and overloaded surfaces exposed the hinge weakness."}
}


def create_gear(x, y, radius, num_teeth, key, layer=1, color=None, is_internal=False,
                alpha=20.0, beta=0.0, sprite_idx=0):
    m = METHODS[key]
    if color is None:
        color = [(75, 95, 125), (55, 135, 115), (195, 115, 55)][layer]
    return Gear(
        x=x, y=y, radius=radius, num_teeth=num_teeth, key=key,
        label=key[:6], full=m["full"], phase=m["phase"],
        desc=m["desc"], insight=m["insight"],
        layer=layer, color=color, is_internal=is_internal,
        alpha=alpha, beta=beta, sprite_idx=sprite_idx
    )


# ====================== CLOCKWORK ======================

class Clockwork:
    def __init__(self, sprites=None):
        self.sprites = sprites
        self.gears: list[Gear] = []
        self.connections: list[tuple[int, int]] = []
        self.driver_idx = 0
        self.base_omega = 0.85
        self.simulation_time = 0.0
        self.running = True
        self.speed_mult = 1.0
        self.jammed = False
        self.current_preset = ""
        self.layer_visible = [True, True, True]
        self.clock_visible = True
        self.debug_mode = False
        self.hovered_idx = None
        self.selected_idx = None
        self.presets = self._define_presets()
        self.load_preset("Integrated Cycle")

    def _define_presets(self):
        p = {}
        p["Discovery Mode"] = {
            "name": "Discovery Mode (Phase 1)",
            "gears": [
                {"x":240, "y":380, "radius":62, "num_teeth":22, "key":"FOTW",    "layer":0, "sprite_idx":0},
                {"x":360, "y":320, "radius":48, "num_teeth":17, "key":"INTVW",   "layer":0, "sprite_idx":1},
                {"x":480, "y":400, "radius":55, "num_teeth":19, "key":"ASSUMPT", "layer":0, "sprite_idx":2},
                {"x":360, "y":500, "radius":45, "num_teeth":16, "key":"OPPMAP",  "layer":1, "sprite_idx":3},
                {"x":520, "y":280, "radius":42, "num_teeth":15, "key":"STAKE",   "layer":1, "sprite_idx":4},
            ],
            "connections": [(0,1),(1,2),(0,3),(2,4)],
            "driver_idx": 0, "clock_ratio": 0.45
        }
        p["Framing Mode"] = {
            "name": "Framing Mode (Phase 2)",
            "gears": [
                {"x":220, "y":390, "radius":58, "num_teeth":20, "key":"STAKE",  "layer":1, "sprite_idx":5},
                {"x":340, "y":340, "radius":65, "num_teeth":23, "key":"HMW",    "layer":1, "sprite_idx":6},
                {"x":460, "y":300, "radius":48, "num_teeth":17, "key":"INSIGHT","layer":1, "beta":5, "sprite_idx":7},
                {"x":460, "y":480, "radius":50, "num_teeth":18, "key":"JMAP",   "layer":1, "beta": -6, "sprite_idx":8},
                {"x":580, "y":390, "radius":45, "num_teeth":16, "key":"BOUND",  "layer":1, "sprite_idx":9},
            ],
            "connections": [(0,1),(1,2),(1,3),(2,4),(3,4)],
            "driver_idx": 1, "clock_ratio": 0.75
        }
        p["Ideation Mode"] = {
            "name": "Ideation Mode (Phase 3)",
            "gears": [
                {"x":230, "y":350, "radius":58, "num_teeth":20, "key":"C8",       "layer":2, "beta":8,  "sprite_idx":0},
                {"x":340, "y":280, "radius":44, "num_teeth":15, "key":"WORST",    "layer":2, "sprite_idx":1},
                {"x":340, "y":450, "radius":42, "num_teeth":15, "key":"INITIDEA", "layer":2, "sprite_idx":2},
                {"x":450, "y":320, "radius":48, "num_teeth":17, "key":"COMBINE",  "layer":1, "beta":4,  "sprite_idx":3},
                {"x":450, "y":460, "radius":46, "num_teeth":16, "key":"SCAMPER",  "layer":1, "sprite_idx":4},
                {"x":560, "y":280, "radius":40, "num_teeth":14, "key":"CONCSKETCH","layer":2, "sprite_idx":5},
                {"x":560, "y":420, "radius":52, "num_teeth":18, "key":"STORY",    "layer":2, "beta":-5, "sprite_idx":6},
                {"x":680, "y":360, "radius":45, "num_teeth":16, "key":"PROTO",    "layer":1, "sprite_idx":7},
            ],
            "connections": [(0,1),(0,2),(1,3),(2,3),(3,4),(3,5),(4,6),(5,7),(6,7)],
            "driver_idx": 0, "clock_ratio": 1.25
        }
        p["Evaluation Mode"] = {
            "name": "Evaluation Mode (Phases 4-5)",
            "gears": [
                {"x":210, "y":360, "radius":52, "num_teeth":18, "key":"SVCBLUE",  "layer":1, "sprite_idx":8},
                {"x":320, "y":300, "radius":48, "num_teeth":17, "key":"FUNCREQ",  "layer":1, "sprite_idx":9},
                {"x":320, "y":460, "radius":45, "num_teeth":16, "key":"SPECHYP",  "layer":2, "sprite_idx":10},
                {"x":430, "y":340, "radius":50, "num_teeth":18, "key":"VERVAL",   "layer":2, "beta":3,  "sprite_idx":11},
                {"x":430, "y":480, "radius":42, "num_teeth":15, "key":"RACI",     "layer":1, "sprite_idx":12},
                {"x":540, "y":300, "radius":55, "num_teeth":19, "key":"FMEA",     "layer":2, "sprite_idx":13},
                {"x":540, "y":460, "radius":48, "num_teeth":17, "key":"EVALPLAN", "layer":1, "sprite_idx":14},
                {"x":650, "y":380, "radius":44, "num_teeth":15, "key":"SPECTABLE","layer":2, "sprite_idx":15},
                {"x":750, "y":320, "radius":40, "num_teeth":14, "key":"TBT",      "layer":2, "sprite_idx":0},
                {"x":750, "y":460, "radius":42, "num_teeth":15, "key":"TRADE",    "layer":1, "sprite_idx":1},
            ],
            "connections": [(0,1),(0,2),(1,3),(2,3),(3,4),(3,5),(4,6),(5,7),(6,8),(7,9),(8,9)],
            "driver_idx": 0, "clock_ratio": 0.7
        }
        p["Integrated Cycle"] = {
            "name": "Integrated Cycle (All Phases)",
            "gears": [
                {"x":220, "y":340, "radius":50, "num_teeth":18, "key":"FOTW",     "layer":0, "sprite_idx":2},
                {"x":320, "y":280, "radius":44, "num_teeth":15, "key":"STAKE",    "layer":1, "sprite_idx":3},
                {"x":320, "y":440, "radius":46, "num_teeth":16, "key":"HMW",      "layer":1, "beta":5,  "sprite_idx":4},
                {"x":430, "y":320, "radius":52, "num_teeth":18, "key":"C8",       "layer":2, "beta":7,  "sprite_idx":5},
                {"x":430, "y":460, "radius":48, "num_teeth":17, "key":"STORY",    "layer":2, "sprite_idx":6},
                {"x":540, "y":280, "radius":42, "num_teeth":15, "key":"FMEA",     "layer":2, "sprite_idx":7},
                {"x":540, "y":440, "radius":45, "num_teeth":16, "key":"TBT",      "layer":2, "sprite_idx":8},
                {"x":650, "y":360, "radius":40, "num_teeth":14, "key":"TRADE",    "layer":1, "sprite_idx":9},
                {"x":750, "y":400, "radius":38, "num_teeth":14, "key":"DECREC",   "layer":1, "sprite_idx":10},
            ],
            "connections": [(0,1),(1,2),(2,3),(2,4),(3,5),(4,6),(5,7),(6,7),(7,8)],
            "driver_idx": 0, "clock_ratio": 0.9
        }
        return p

    def load_preset(self, key):
        if key not in self.presets:
            key = list(self.presets.keys())[0]
        p = self.presets[key]
        self.gears = []
        for gdict in p["gears"]:
            # gdict is now a plain dict → create Gear object
            params = {k: v for k, v in gdict.items() if k != "sprite_idx"}
            g = create_gear(**params)
            g.sprite_idx = gdict.get("sprite_idx", 0)
            self.gears.append(g)

        self.connections = list(p["connections"])
        self.driver_idx = p["driver_idx"]
        self.clock_ratio = p.get("clock_ratio", 1.0)
        self.current_preset = key
        self.simulation_time = 0.0
        self.jammed = False
        self.selected_idx = None
        for g in self.gears:
            g.angle = 0.0
            g.omega = 0.0
            g.visible = True
            g.conflict = False
        self._recompute_velocities()

    def _recompute_velocities(self):
        for g in self.gears:
            g.omega = 0.0
        if not self.gears:
            return
        self.gears[self.driver_idx].omega = self.base_omega * self.speed_mult

        visited = {self.driver_idx}
        q = deque([self.driver_idx])
        while q:
            curr = q.popleft()
            for a, b in self.connections:
                other = b if a == curr else a if b == curr else None
                if other is None or other in visited:
                    continue
                r1 = self.gears[curr].radius
                r2 = self.gears[other].radius
                sgn = 1 if (self.gears[curr].is_internal != self.gears[other].is_internal) else -1
                self.gears[other].omega = sgn * (r1 / max(r2, 1e-6)) * self.gears[curr].omega
                visited.add(other)
                q.append(other)

    # ====================== NEW COLLISION / JAMMING LOGIC ======================
    def _resolve_collisions_from_clock(self):
        """Start from clock area. On same-direction collision → reverse the colliding gear.
        Then back-propagate through kinematic chain. Jam only if conflict remains."""
        self.has_conflict = False
        for g in self.gears:
            g.conflict = False

        # === Clock Gear (acts in collision system) ===
        class ClockGear:
            def __init__(self):
                self.x = 620
                self.y = 420
                self.radius = 42
                self.omega = 1.0          # Clock "drives" forward
                self.visible = True
                self.conflict = False

        clock_gear = ClockGear()
        objs = [(g.x, g.y, g.radius, g.omega, i, g) for i, g in enumerate(self.gears) if g.visible]
        objs.append((clock_gear.x, clock_gear.y, clock_gear.radius, clock_gear.omega, -1, clock_gear))

        # Check collisions with clock first (use visual radius -5%)
        for x, y, r, omega, idx, g in objs:
            effective_r = r * 0.95
            dist = math.hypot(x - clock_gear.x, y - clock_gear.y)
            if dist < (effective_r + clock_gear.radius * 0.95 + 6):
                if omega > 0:
                    if hasattr(g, 'omega'):
                        g.omega *= -1
                    g.conflict = True
                    self.has_conflict = True

        # Gear-to-gear collisions using visual radius -5%
        for i in range(len(objs)):
            for j in range(i + 1, len(objs)):
                x1, y1, r1, o1, i1, g1 = objs[i]
                x2, y2, r2, o2, i2, g2 = objs[j]
                dist = math.hypot(x1 - x2, y1 - y2)
                eff_r1 = r1 * 0.95
                eff_r2 = r2 * 0.95
                if dist < (eff_r1 + eff_r2 + 6):
                    if o1 * o2 > 0:
                        if hasattr(g1, 'omega'):
                            g1.omega *= -1
                        if hasattr(g2, 'omega'):
                            g2.omega *= -1
                        g1.conflict = True
                        g2.conflict = True
                        self.has_conflict = True

        if self.has_conflict:
            # Back-propagate the reversals through the connection graph
            self._recompute_velocities()

            # Final check: if any same-direction overlap still exists → hard jam
            for i in range(len(objs)):
                for j in range(i + 1, len(objs)):
                    x1, y1, r1, o1, _, _ = objs[i]
                    x2, y2, r2, o2, _, _ = objs[j]
                    if math.hypot(x1-x2, y1-y2) < (r1 + r2 + 10) and o1 * o2 > 0:
                        self.jammed = True
                        self.running = False
                        return
            # If we reached here, conflicts were resolved by reversing
            self.jammed = False

    def update(self, dt):
        if not self.running or self.jammed or self.speed_mult <= 0:
            return

        self.simulation_time += dt * self.base_omega * self.speed_mult

        for g in self.gears:
            if g.visible:
                g.angle = (g.angle + g.omega * dt) % (2 * math.pi)

        self._resolve_collisions_from_clock()

    # ====================== DRAWING ======================

    def draw_gear(self, surf, g: Gear, highlight=False):
        if not g.visible:
            return
        cx, cy = int(g.x), int(g.y)

        if self.sprites and 0 <= g.sprite_idx < len(self.sprites):
            # Use sprite, scaled to match the gear's radius
            # The sprites look best when their visual size is slightly larger than the collision radius
            sprite = self.sprites[g.sprite_idx]
            reference_radius = 44          # base size the sprites were designed for
            visual_scale = 1.15            # make sprites appear a bit larger visually
            scale = (g.radius / reference_radius) * visual_scale

            # Scale then rotate (better quality)
            scaled_size = (int(sprite.get_width() * scale), int(sprite.get_height() * scale))
            scaled_sprite = pygame.transform.smoothscale(sprite, scaled_size)
            rotated = pygame.transform.rotate(scaled_sprite, -math.degrees(g.angle))

            rect = rotated.get_rect(center=(cx, cy))
            surf.blit(rotated, rect)

            # Optional highlight tint when selected
            if highlight:
                overlay = pygame.Surface(rotated.get_size(), pygame.SRCALPHA)
                overlay.fill((255, 225, 110, 70))
                surf.blit(overlay, rect)
        else:
            # Fallback: High-quality procedurally generated involute gear (polygon)
            self._draw_involute_gear(surf, g, highlight)

        # Axle
        pygame.draw.circle(surf, (30, 30, 40), (cx, cy), 8, 0)
        pygame.draw.circle(surf, (240, 240, 250), (cx, cy), 4, 0)

        # Label with white highlight behind it (for readability on dark/busy gears)
        if g.label:
            font = pygame.font.SysFont("dejavusans", 12, bold=True)
            text_surf = font.render(g.label, True, (20, 20, 30))

            # Create a soft white rounded rectangle highlight (reduced size)
            padding_x = 3   # was 5 (-40%)
            padding_y = 1   # was 2 (-50%)
            hl_w = text_surf.get_width() + padding_x * 2
            hl_h = text_surf.get_height() + padding_y * 2
            highlight = pygame.Surface((hl_w, hl_h), pygame.SRCALPHA)
            pygame.draw.rect(highlight, (255, 255, 255, 235), highlight.get_rect(), border_radius=4)

            # Rotate both highlight and text together with the gear
            angle_deg = -math.degrees(g.angle)
            rot_highlight = pygame.transform.rotate(highlight, angle_deg)
            rot_text = pygame.transform.rotate(text_surf, angle_deg)

            # Center them on the gear
            hx = cx - rot_highlight.get_width() // 2
            hy = cy - rot_highlight.get_height() // 2
            tx = cx - rot_text.get_width() // 2
            ty = cy - rot_text.get_height() // 2

            surf.blit(rot_highlight, (hx, hy))
            surf.blit(rot_text, (tx, ty))

        # Debug: show conflict
        if self.debug_mode and g.conflict:
            pygame.draw.circle(surf, (255, 50, 50), (cx, cy), int(g.radius) + 4, 3)

    def _draw_involute_gear(self, surf, g: Gear, highlight=False):
        """Draw a high-quality involute gear using polygons (fallback when no sprite sheet)."""
        cx, cy = int(g.x), int(g.y)
        r = g.radius
        num_teeth = g.num_teeth
        angle = g.angle

        color = (255, 225, 110) if highlight else g.color

        # Generate one tooth profile (simplified but good-looking involute-style)
        tooth_profile = self._generate_tooth_profile(r, num_teeth)

        # Draw all teeth as rotated polygons
        tooth_angle = 2 * math.pi / num_teeth
        for i in range(num_teeth):
            rot = angle + i * tooth_angle
            cos_r, sin_r = math.cos(rot), math.sin(rot)

            points = []
            for px, py in tooth_profile:
                wx = px
                wy = py
                rx = wx * cos_r - wy * sin_r
                ry = wx * sin_r + wy * cos_r
                points.append((cx + rx, cy + ry))

            if len(points) >= 3:
                pygame.draw.polygon(surf, color, [(int(p[0]), int(p[1])) for p in points])

        # Draw root circle (body of the gear)
        root_r = r * 0.82
        pygame.draw.circle(surf, color, (cx, cy), int(root_r), 0)

        # Subtle pitch circle
        pygame.draw.circle(surf, (150, 150, 160), (cx, cy), int(r), 1)

    def _generate_tooth_profile(self, pitch_radius, num_teeth):
        """Generate a single tooth profile (involute-like shape)."""
        points = []
        # Simple but effective tooth shape
        addendum = pitch_radius * 0.18
        dedendum = pitch_radius * 0.22
        tooth_width = (2 * math.pi / num_teeth) * 0.42

        # Left flank (curved-ish)
        for t in range(8):
            s = t / 7.0
            r = pitch_radius - dedendum + s * (addendum + dedendum)
            a = -tooth_width/2 + s * tooth_width * 0.3
            points.append((r * math.sin(a), r * math.cos(a)))

        # Tip
        tip_r = pitch_radius + addendum
        for t in range(5):
            a = -tooth_width * 0.08 + t * (tooth_width * 0.16 / 4)
            points.append((tip_r * math.sin(a), tip_r * math.cos(a)))

        # Right flank
        for t in range(8):
            s = t / 7.0
            r = pitch_radius + addendum - s * (addendum + dedendum)
            a = tooth_width/2 - s * tooth_width * 0.3
            points.append((r * math.sin(a), r * math.cos(a)))

        # Close back to root
        root_r = pitch_radius - dedendum
        points.append((root_r * math.sin(-tooth_width * 0.5), root_r * math.cos(-tooth_width * 0.5)))

        return points

    def draw_clock(self, surf, cx, cy, r=95, draw_hands=True, only_hands=False):
        if not self.clock_visible:
            return

        # Draw face unless we're only drawing hands
        if not only_hands:
            # Clock base
            pygame.draw.circle(surf, (60, 55, 45), (int(cx), int(cy)), int(r), 0)
            pygame.draw.circle(surf, (180, 160, 120), (int(cx), int(cy)), int(r), 5)

            inner_r = r * 0.82
            pygame.draw.circle(surf, (45, 42, 35), (int(cx), int(cy)), int(inner_r), 0)

            # Subtle gear teeth pattern
            for i in range(24):
                a = i * (2 * math.pi / 24)
                x1 = cx + inner_r * 0.92 * math.cos(a)
                y1 = cy + inner_r * 0.92 * math.sin(a)
                x2 = cx + inner_r * 1.02 * math.cos(a)
                y2 = cy + inner_r * 1.02 * math.sin(a)
                pygame.draw.line(surf, (180, 160, 120), (x1, y1), (x2, y2), 2)

            # Hour marks
            for i in range(12):
                a = i * (2 * math.pi / 12) - math.pi / 2
                length = 10 if i % 3 == 0 else 6
                pygame.draw.line(surf, (200, 190, 160),
                                 (cx + (r - 14) * math.cos(a), cy + (r - 14) * math.sin(a)),
                                 (cx + (r - 14 - length) * math.cos(a), cy + (r - 14 - length) * math.sin(a)), 3)

        # Hands (drawn when draw_hands=True)
        if draw_hands:
            t = self.simulation_time * getattr(self, 'clock_ratio', 1.0)

            sec_ang = math.radians((t * 6) % 360 - 90)
            pygame.draw.line(surf, (200, 60, 60), (cx, cy),
                             (cx + (r - 18) * math.cos(sec_ang), cy + (r - 18) * math.sin(sec_ang)), 2)

            min_ang = math.radians((t * 0.1) % 360 - 90)
            pygame.draw.line(surf, (220, 210, 190), (cx, cy),
                             (cx + (r - 28) * math.cos(min_ang), cy + (r - 28) * math.sin(min_ang)), 4)

            hour_ang = math.radians((t * (0.1 / 12)) % 360 - 90)
            pygame.draw.line(surf, (220, 210, 190), (cx, cy),
                             (cx + (r - 42) * math.cos(hour_ang), cy + (r - 42) * math.sin(hour_ang)), 5)

            pygame.draw.circle(surf, (180, 160, 120), (int(cx), int(cy)), 9, 0)
            pygame.draw.circle(surf, (60, 55, 45), (int(cx), int(cy)), 5, 0)

    def draw(self, surf):
        # White background
        surf.fill((250, 250, 252))

        # Main mechanism area (light gray)
        pygame.draw.rect(surf, (240, 242, 248), (180, 80, 850, 700), border_radius=12)
        pygame.draw.rect(surf, (180, 185, 195), (180, 80, 850, 700), 2, border_radius=12)

        # Draw gears
        for layer in range(3):
            if not self.layer_visible[layer]:
                continue
            for i, g in enumerate(self.gears):
                if g.layer == layer:
                    self.draw_gear(surf, g, highlight=(i == self.hovered_idx or i == self.selected_idx))

        # Connection lines
        for a, b in self.connections:
            if self.gears[a].visible and self.gears[b].visible:
                pygame.draw.line(surf, (150, 155, 165),
                                 (self.gears[a].x, self.gears[a].y),
                                 (self.gears[b].x, self.gears[b].y), 1)

        # === Layering: Clock face (toggleable) → Gear → Hands ===

        # 1. Clock face (toggleable with C key)
        if self.clock_visible:
            self.draw_clock(surf, 620, 420, draw_hands=False)

        # 2. Clock gear (on top of face)
        clock_gear = type('obj', (object,), {
            'x': 620, 'y': 420, 'radius': 42, 'num_teeth': 20,
            'angle': self.simulation_time * 0.7,
            'visible': True, 'label': None, 'color': (70, 65, 55)
        })()
        self._draw_involute_gear(surf, clock_gear, highlight=False)

        # 3. Clock hands (on top of gear)
        if self.clock_visible:
            self.draw_clock(surf, 620, 420, only_hands=True)

        # Title bar
        font_title = pygame.font.SysFont("dejavusans", 18, bold=True)
        font_sub = pygame.font.SysFont("dejavusans", 14)
        title = font_title.render("DESIGN METHODS CLOCKWORK v3 — Sprite Gears + Smart Jamming", True, (30, 30, 40))
        surf.blit(title, (200, 92))
        sub = font_sub.render(self.presets.get(self.current_preset, {}).get("name", ""), True, (80, 140, 200))
        surf.blit(sub, (200, 118))

        status = "JAMMED (conflict resolved by reversing)" if self.jammed else ("RUNNING" if self.running else "PAUSED")
        col = (200, 50, 50) if self.jammed else ((40, 180, 90) if self.running else (200, 160, 40))
        surf.blit(font_sub.render(status, True, col), (200, 142))

        if self.debug_mode:
            dbg = font_sub.render("DEBUG: Red rings = conflict | Press D to toggle", True, (180, 50, 50))
            surf.blit(dbg, (200, 165))

    # ====================== INPUT & HELPERS ======================

    def handle_mouse(self, mx, my, click=False):
        self.hovered_idx = None
        for i, g in enumerate(self.gears):
            if g.visible and math.hypot(mx - g.x, my - g.y) < g.radius + 10:
                self.hovered_idx = i
                if click:
                    self.selected_idx = i
                return True
        if click:
            self.selected_idx = None
        return False

    def get_selected_info(self):
        if self.selected_idx is not None and 0 <= self.selected_idx < len(self.gears):
            return self.gears[self.selected_idx]
        return None

    def toggle_layer(self, idx):
        self.layer_visible[idx] = not self.layer_visible[idx]
        for g in self.gears:
            if g.layer == idx:
                g.visible = self.layer_visible[idx]
        self._recompute_velocities()

    def toggle_clock(self):
        self.clock_visible = not self.clock_visible

    def set_speed(self, m):
        self.speed_mult = max(0.0, min(3.0, m))
        self._recompute_velocities()

    def toggle_run(self):
        self.running = not self.running

    def toggle_debug(self):
        self.debug_mode = not self.debug_mode


# ====================== UI ======================

def draw_ui(surf, cw: Clockwork):
    # Left panel
    pygame.draw.rect(surf, (245, 247, 252), (20, 80, 150, 700), border_radius=8)
    pygame.draw.rect(surf, (80, 140, 200), (20, 80, 150, 700), 2, border_radius=8)

    y = 95
    font = pygame.font.SysFont("dejavusans", 13, bold=True)
    surf.blit(font.render("PRESETS (keys 1-5)", True, (30, 30, 40)), (28, y)); y += 20

    for i, key in enumerate(cw.presets.keys()):
        col = (255, 200, 50) if key == cw.current_preset else (60, 60, 70)
        surf.blit(pygame.font.SysFont("dejavusans", 11).render(f"{i+1}. {key}", True, col), (28, y))
        y += 15

    y += 12
    surf.blit(font.render("LAYERS (L to cycle)", True, (30, 30, 40)), (28, y)); y += 18
    names = ["Layer 1 (Back)", "Layer 2 (Mid)", "Layer 3 (Front)"]
    for i, n in enumerate(names):
        vis = "●" if cw.layer_visible[i] else "○"
        col = (40, 180, 90) if cw.layer_visible[i] else (180, 80, 80)
        surf.blit(pygame.font.SysFont("dejavusans", 10).render(f"{vis} {n}", True, col), (28, y))
        y += 13

    y += 8
    vis = "●" if cw.clock_visible else "○"
    surf.blit(pygame.font.SysFont("dejavusans", 10).render(f"{vis} Clock Face (C)", True, (60, 60, 70)), (28, y)); y += 18

    surf.blit(font.render("SPEED (scroll)", True, (30, 30, 40)), (28, y)); y += 15
    surf.blit(pygame.font.SysFont("dejavusans", 12).render(f"{cw.speed_mult:.1f}x", True, (30, 30, 40)), (28, y)); y += 20

    surf.blit(pygame.font.SysFont("dejavusans", 10).render("P/Space = Pause | R = Reset", True, (100, 100, 110)), (25, y)); y += 13
    surf.blit(pygame.font.SysFont("dejavusans", 10).render("D = Debug mode | Click gear = Inspect", True, (100, 100, 110)), (25, y))

    # Right panel
    pygame.draw.rect(surf, (245, 247, 252), (1050, 80, 330, 700), border_radius=8)
    pygame.draw.rect(surf, (80, 140, 200), (1050, 80, 330, 700), 2, border_radius=8)

    y = 95
    surf.blit(font.render("METHOD INSIGHT", True, (30, 30, 40)), (1065, y)); y += 26

    info = cw.get_selected_info()
    if info:
        surf.blit(pygame.font.SysFont("dejavusans", 13, bold=True).render(info.full, True, (255, 180, 40)), (1065, y)); y += 16
        surf.blit(pygame.font.SysFont("dejavusans", 11).render(info.phase, True, (80, 140, 200)), (1065, y)); y += 16
        for line in [info.desc[:60], info.desc[60:120]]:
            if line.strip():
                surf.blit(pygame.font.SysFont("dejavusans", 10).render(line, True, (40, 40, 50)), (1065, y))
                y += 12
        y += 8
        surf.blit(pygame.font.SysFont("dejavusans", 10, bold=True).render("From your reflection:", True, (180, 140, 60)), (1065, y)); y += 13
        for line in [info.insight[:65], info.insight[65:130]]:
            if line.strip():
                surf.blit(pygame.font.SysFont("dejavusans", 10).render(line, True, (60, 60, 70)), (1065, y))
                y += 11
    else:
        surf.blit(pygame.font.SysFont("dejavusans", 11).render("Click any gear to inspect its", True, (80, 80, 90)), (1065, y)); y += 14
        surf.blit(pygame.font.SysFont("dejavusans", 11).render("role in the design process.", True, (80, 80, 90)), (1065, y))


# ====================== MAIN ======================

def main():
    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("Method Studio | Design Methods Clockwork v3")
    clock = pygame.time.Clock()

    sprites = load_and_process_spritesheet(SPRITE_SHEET_PATH)
    cw = Clockwork(sprites=sprites)

    running = True
    while running:
        dt = clock.tick(FPS) / 1000.0
        mx, my = pygame.mouse.get_pos()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False
                elif event.key in (pygame.K_p, pygame.K_SPACE):
                    cw.toggle_run()
                elif event.key == pygame.K_r:
                    for g in cw.gears:
                        g.angle = 0.0
                    cw.simulation_time = 0.0
                elif event.key == pygame.K_c:
                    cw.toggle_clock()
                elif event.key == pygame.K_l:
                    # Cycle layers
                    if all(cw.layer_visible):
                        cw.layer_visible = [True, True, False]
                    elif cw.layer_visible[2] is False and cw.layer_visible[1]:
                        cw.layer_visible = [True, False, False]
                    else:
                        cw.layer_visible = [True, True, True]
                    for i in range(3):
                        for g in cw.gears:
                            if g.layer == i:
                                g.visible = cw.layer_visible[i]
                    cw._recompute_velocities()
                elif event.key == pygame.K_d:
                    cw.toggle_debug()
                elif event.key == pygame.K_1:
                    cw.load_preset("Discovery Mode")
                elif event.key == pygame.K_2:
                    cw.load_preset("Framing Mode")
                elif event.key == pygame.K_3:
                    cw.load_preset("Ideation Mode")
                elif event.key == pygame.K_4:
                    cw.load_preset("Evaluation Mode")
                elif event.key == pygame.K_5:
                    cw.load_preset("Integrated Cycle")

            elif event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 1:
                    cw.handle_mouse(mx, my, click=True)
                elif event.button == 4:
                    cw.set_speed(cw.speed_mult + 0.12)
                elif event.button == 5:
                    cw.set_speed(cw.speed_mult - 0.12)
            elif event.type == pygame.MOUSEMOTION:
                cw.handle_mouse(mx, my, click=False)

        cw.update(dt)
        cw.draw(screen)
        draw_ui(screen, cw)

        if cw.hovered_idx is not None and 0 <= cw.hovered_idx < len(cw.gears):
            g = cw.gears[cw.hovered_idx]
            tip = f"{g.full} | {g.phase}"
            ts = pygame.font.SysFont("dejavusans", 10).render(tip, True, (30, 30, 40))
            screen.blit(ts, (min(mx + 12, WIDTH - 200), min(my + 8, HEIGHT - 20)))

        pygame.display.flip()

    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    main()
