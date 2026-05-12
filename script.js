// Design Methods Clockwork - Browser Version (Canvas + JS)
// Port of the original Pygame simulation

const METHODS = {
    "AEIOU":    {full: "AEIOU Observation",          phase: "Opportunity Recognition",       desc: "Systematic observation framework.", insight: "Grounded opportunity map in student voices."},
    "FOTW":     {full: "Fly-on-the-Wall",            phase: "Opportunity Recognition",       desc: "Neutral real-time observation.", insight: "Shows unfiltered behaviors."},
    "INTVW":    {full: "Stakeholder Interviews",     phase: "Opportunity Recognition & Problem Framing",   desc: "Turns raw data into insights and HMWs.", insight: "Revealed credit stress and manual bottlenecks."},
    "ASSUMPT":  {full: "Assumption Mapping",         phase: "Opportunity Recognition",       desc: "Ranks beliefs to make biases visible and testable.", insight: "Revealed high-risk assumptions about independence vs preparedness."},
    "OPPMAP":   {full: "Opportunity Mapping",        phase: "Opportunity Recognition",       desc: "Synthesizes observations into opportunity areas and tensions.", insight: "Mapped recurring tensions in social integration and academic readiness."},
    "INSIGHT":  {full: "Insight Statements",         phase: "Problem Framing",       desc: "Bridges observation to framing.", insight: "Made tension between excitement and process visible."},
    "HMW":      {full: "How-Might-We Questions",     phase: "Problem Framing",       desc: "Generative questions that shift responsibility.", insight: "Different HMWs open different solution spaces."},
    "JMAP":     {full: "Journey Mapping",            phase: "Problem Framing",       desc: "Visualizes end-to-end experience and handoffs.", insight: "Exposed manual syllabus comparison bottleneck."},
    "STAKE":    {full: "Stakeholder Mapping",        phase: "Problem Framing",       desc: "Identifies all stakeholders to prevent single-perspective conclusions.", insight: "Exposed communication gaps between offices, departments, and students."},
    "BOUND":    {full: "Boundary Definition",        phase: "Problem Framing & Specification as Hypothesis",   desc: "Explicitly defines what is in and out of scope.", insight: "Clarified short-term visibility vs long-term retention."},
    "C8":       {full: "Crazy 8s",                   phase: "Solution Concepting",       desc: "Rapid divergent sketching.", insight: "Breadth before depth; ridiculous ideas sparked good ones."},
    "WORST":    {full: "Worst Possible Ideas",       phase: "Solution Concepting",       desc: "Deliberately bad ideas to break assumptions and spark creativity.", insight: "Terrible ideas often contained the seeds of the best solutions."},
    "INITIDEA": {full: "Initial Ideas",              phase: "Solution Concepting",       desc: "Quick generation of raw concepts without judgment.", insight: "Volume and variety in the first pass led to stronger later concepts."},
    "COMBINE":  {full: "Combined Ideas",             phase: "Solution Concepting",       desc: "Merging multiple concepts to create hybrid solutions.", insight: "Unexpected combinations produced the most novel directions."},
    "SCAMPER":  {full: "SCAMPER",                    phase: "Solution Concepting",       desc: "Structured provocation on existing elements.", insight: "Unexpected directions emerged from provocation."},
    "CONCSKETCH":{full: "Concept Sketches",          phase: "Solution Concepting",       desc: "Quick visual exploration of form and interaction.", insight: "Drawing made spatial and ergonomic issues visible early."},
    "STORY":    {full: "Storyboarding",              phase: "Solution Concepting",       desc: "Makes experiences legible for comparison and refinement.", insight: "Strong concepts combine activity + optional signal."},
    "PROTO":    {full: "Prototyping",                phase: "Solution Concepting",       desc: "Low-fidelity making to test assumptions quickly.", insight: "Making revealed feasibility issues that sketches missed."},
    "SVCBLUE":  {full: "Service Blueprint",          phase: "Specification as Hypothesis",       desc: "Maps the full service journey and backstage processes.", insight: "Made invisible support processes and failure points visible."},
    "FUNCREQ":  {full: "Functional Requirements",    phase: "Specification as Hypothesis",       desc: "Defines what the solution must do.", insight: "Clarified must-have vs nice-to-have features."},
    "SPECHYP":  {full: "Specification-as-Hypothesis",phase: "Specification as Hypothesis",       desc: "Makes claims falsifiable and testable.", insight: "Turned vague intent into measurable hypotheses."},
    "VERVAL":   {full: "Verification as Validation", phase: "Specification as Hypothesis",       desc: "Checks that the design meets its own specifications.", insight: "Early verification caught critical mismatches before building."},
    "RACI":     {full: "RACI Table",                 phase: "Specification as Hypothesis",       desc: "Clarifies roles: Responsible, Accountable, Consulted, Informed.", insight: "Removed ambiguity about who owns each part of the project."},
    "FMEA":     {full: "FMEA",                       phase: "Specification as Hypothesis & Concept Evaluation",   desc: "Quantifies risk with RPN scores.", insight: "Prioritized where to add durability and feedback."},
    "EVALPLAN": {full: "Evaluation Plan",            phase: "Concept Evaluation",       desc: "Defines criteria, methods, and success metrics upfront.", insight: "Clear plan kept testing focused and comparable across iterations."},
    "SPECTABLE": {full: "Specification Table",       phase: "Concept Evaluation",       desc: "Organizes requirements with measurable targets.", insight: "Made it obvious which specs were met or needed iteration."},
    "DECREC":   {full: "Decision Recommendation",    phase: "Concept Evaluation",       desc: "Synthesizes evidence into a clear go / pivot / stop call.", insight: "Evidence strongly supported proceeding with refinements."},
    "KEYFIND":  {full: "Key Findings",               phase: "Concept Evaluation",       desc: "Distills the most important patterns and surprises from testing.", insight: "Hinge tilt and rubber feet dust collection were critical usability issues."},
    "LIMMEMO":  {full: "Limitations Memo",           phase: "Concept Evaluation",       desc: "Explicitly documents what the evaluation did not cover.", insight: "Long-term durability and wider user diversity remain untested."},
    "TBT":      {full: "Task-Based Testing",         phase: "Concept Evaluation",       desc: "Measures real performance on representative tasks.", insight: "Revealed conditional stability on weight and surface; setup averaged ~6s."},
    "TRADE":    {full: "Trade-off Analysis",         phase: "Concept Evaluation",       desc: "Makes inherent compromises visible.", insight: "Weighed stability vs speed vs adjustability; 3x stable claim holds up to ~5.5 lb."},
    "COMPARE":  {full: "Comparative Testing",        phase: "Concept Evaluation",       desc: "Side-by-side evaluation against alternatives or benchmarks.", insight: "Direct comparison highlighted clear advantages in adjustability."},
    "EDGECASE": {full: "Edge Case Testing",          phase: "Concept Evaluation",       desc: "Probes extreme conditions and model simulation.", insight: "Extreme angles and overloaded surfaces exposed the hinge weakness."}
};

const PRESETS = {
    "Opportunity Recognition": {
        name: "Opportunity Recognition",
        gears: [
            {x:180, y:320, radius:58, numTeeth:22, key:"FOTW",    layer:0, type:"spur"},
            {x:290, y:270, radius:46, numTeeth:17, key:"INTVW",   layer:0, type:"helical"},
            {x:400, y:340, radius:52, numTeeth:19, key:"ASSUMPT", layer:0, type:"spur"},
            {x:290, y:420, radius:44, numTeeth:16, key:"OPPMAP",  layer:1, type:"internal"},
            {x:430, y:240, radius:40, numTeeth:15, key:"STAKE",   layer:1, type:"miter"},
        ],
        connections: [[0,1],[1,2],[0,3],[2,4]],
        connectionTypes: ["drive", "drive", "synthesis", "drive"],
        clockConnections: [3, 4],  // OPPMAP & STAKE → final opportunity synthesis feeds the clock
        driverIdx: 0,
        clockRatio: 0.45
    },
    "Problem Framing": {
        name: "Problem Framing",
        gears: [
            {x:170, y:330, radius:55, numTeeth:20, key:"STAKE",  layer:1, type:"spur"},
            {x:280, y:290, radius:62, numTeeth:23, key:"HMW",    layer:1, type:"helical"},
            {x:390, y:255, radius:46, numTeeth:17, key:"INSIGHT",layer:1, type:"bevel", beta:5},
            {x:390, y:410, radius:48, numTeeth:18, key:"JMAP",   layer:1, type:"helical", beta:-6},
            {x:500, y:330, radius:43, numTeeth:16, key:"BOUND",  layer:1, type:"spur"},
        ],
        connections: [[0,1],[1,2],[1,3],[2,4],[3,4]],
        connectionTypes: ["drive", "drive", "synthesis", "drive", "feedback"],
        clockConnections: [4],  // BOUND finalizes scope → clock
        driverIdx: 1,
        clockRatio: 0.75
    },
    "Solution Concepting": {
        name: "Solution Concepting",
        gears: [
            {x:175, y:295, radius:55, numTeeth:20, key:"C8",       layer:2, type:"helical", beta:8},
            {x:280, y:235, radius:42, numTeeth:15, key:"WORST",    layer:2, type:"spur"},
            {x:280, y:385, radius:40, numTeeth:15, key:"INITIDEA", layer:2, type:"bevel"},
            {x:380, y:270, radius:46, numTeeth:17, key:"COMBINE",  layer:1, type:"helical", beta:4},
            {x:380, y:390, radius:44, numTeeth:16, key:"SCAMPER",  layer:1, type:"spur"},
            {x:480, y:235, radius:38, numTeeth:14, key:"CONCSKETCH",layer:2, type:"screw"},
            {x:480, y:355, radius:50, numTeeth:18, key:"STORY",    layer:2, type:"helical", beta:-5},
            {x:590, y:300, radius:43, numTeeth:16, key:"PROTO",    layer:1, type:"bevel"},
        ],
        connections: [[0,1],[0,2],[1,3],[2,3],[3,4],[3,5],[4,6],[5,7],[6,7]],
        connectionTypes: ["drive", "drive", "synthesis", "synthesis", "drive", "drive", "synthesis", "drive", "feedback"],
        clockConnections: [7],  // PROTO (prototyping) → clock as tangible output
        driverIdx: 0,
        clockRatio: 1.25
    },
    "Specification as Hypothesis": {
        name: "Specification as Hypothesis",
        gears: [
            {x:160, y:305, radius:50, numTeeth:18, key:"SVCBLUE",  layer:1, type:"spur"},
            {x:265, y:255, radius:46, numTeeth:17, key:"FUNCREQ",  layer:1, type:"helical"},
            {x:265, y:395, radius:43, numTeeth:16, key:"SPECHYP",  layer:2, type:"bevel"},
            {x:365, y:290, radius:48, numTeeth:18, key:"VERVAL",   layer:2, type:"helical", beta:3},
            {x:365, y:410, radius:40, numTeeth:15, key:"RACI",     layer:1, type:"spur"},
            {x:465, y:255, radius:52, numTeeth:19, key:"FMEA",     layer:2, type:"internal"},
            {x:465, y:395, radius:46, numTeeth:17, key:"EVALPLAN", layer:1, type:"bevel"},
            {x:565, y:325, radius:42, numTeeth:15, key:"SPECTABLE",layer:2, type:"helical"},
            {x:660, y:270, radius:38, numTeeth:14, key:"TBT",      layer:2, type:"spur"},
            {x:660, y:395, radius:40, numTeeth:15, key:"TRADE",    layer:1, type:"bevel"},
        ],
        connections: [[0,1],[0,2],[1,3],[2,3],[3,4],[3,5],[4,6],[5,7],[6,8],[7,9],[8,9]],
        connectionTypes: ["drive", "drive", "drive", "synthesis", "drive", "synthesis", "drive", "drive", "drive", "synthesis", "feedback"],
        clockConnections: [8, 9],  // TBT & TRADE → final validation feeds clock
        driverIdx: 0,
        clockRatio: 0.7
    },
    "Concept Evaluation": {
        name: "Concept Evaluation",
        gears: [
            {x:165, y:285, radius:48, numTeeth:18, key:"FOTW",     layer:0, type:"spur"},
            {x:260, y:235, radius:42, numTeeth:15, key:"STAKE",    layer:1, type:"helical"},
            {x:260, y:375, radius:44, numTeeth:16, key:"HMW",      layer:1, type:"bevel", beta:5},
            {x:360, y:270, radius:50, numTeeth:18, key:"C8",       layer:2, type:"helical", beta:7},
            {x:360, y:390, radius:46, numTeeth:17, key:"STORY",    layer:2, type:"spur"},
            {x:460, y:235, radius:40, numTeeth:15, key:"FMEA",     layer:2, type:"miter"},
            {x:460, y:375, radius:43, numTeeth:16, key:"TBT",      layer:2, type:"helical"},
            {x:560, y:305, radius:38, numTeeth:14, key:"TRADE",    layer:1, type:"bevel"},
            {x:650, y:340, radius:36, numTeeth:14, key:"DECREC",   layer:1, type:"spur"},
        ],
        connections: [[0,1],[1,2],[2,3],[2,4],[3,5],[4,6],[5,7],[6,7],[7,8]],
        connectionTypes: ["drive", "drive", "drive", "synthesis", "drive", "drive", "synthesis", "feedback", "synthesis"],
        clockConnections: [8],  // DECREC (Decision Recommendation) → ultimate output to clock
        driverIdx: 0,
        clockRatio: 0.9
    }
};

// ==================== GEAR DRAWING (Diverse Types) ====================
function drawGear(ctx, g, highlight = false) {
    const cx = g.x;
    const cy = g.y;
    const r = g.radius;
    const numTeeth = g.numTeeth;
    const angle = g.angle;
    const type = g.type || "spur";

    // Colors by layer
    let color = highlight ? "#ffe070" : 
                (g.layer === 0 ? "#4b5f7d" : g.layer === 1 ? "#378a76" : "#c37337");

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    if (type === "helical") {
        drawHelicalGear(ctx, r, numTeeth, color);
    } else if (type === "bevel") {
        drawBevelGear(ctx, r, numTeeth, color);
    } else if (type === "miter") {
        drawMiterGear(ctx, r, numTeeth, color);
    } else if (type === "worm") {
        drawWormGear(ctx, r, numTeeth, color);
    } else if (type === "internal") {
        drawInternalGear(ctx, r, numTeeth, color);
    } else if (type === "screw" || type === "crossed") {
        drawScrewGear(ctx, r, numTeeth, color);
    } else {
        drawSpurGear(ctx, r, numTeeth, color);
    }

    ctx.restore();

    // Common elements (axle + label) drawn after restore so they don't rotate with teeth
    // Axle
    ctx.fillStyle = "#1e1e28";
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f0f0f5";
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Label (rotated with gear)
    if (g.label) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        ctx.font = "bold 11px system-ui, sans-serif";
        const text = g.label;
        const metrics = ctx.measureText(text);
        const tw = metrics.width;

        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.beginPath();
        ctx.roundRect(-tw/2 - 4, -8, tw + 8, 16, 4);
        ctx.fill();

        ctx.fillStyle = "#14141e";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 0, 0);

        ctx.restore();
    }
}

function drawSpurGear(ctx, r, numTeeth, color) {
    // Root circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
    ctx.fill();

    // Teeth
    const toothAngle = (Math.PI * 2) / numTeeth;
    const addendum = r * 0.18;
    const dedendum = r * 0.22;
    const toothWidth = toothAngle * 0.42;

    ctx.fillStyle = color;
    for (let i = 0; i < numTeeth; i++) {
        const rot = i * toothAngle;
        ctx.save();
        ctx.rotate(rot);

        ctx.beginPath();
        ctx.moveTo((r - dedendum) * Math.sin(-toothWidth/2), (r - dedendum) * Math.cos(-toothWidth/2));
        ctx.lineTo((r + addendum) * Math.sin(-toothWidth * 0.08), (r + addendum) * Math.cos(-toothWidth * 0.08));
        ctx.lineTo((r + addendum) * Math.sin(toothWidth * 0.08), (r + addendum) * Math.cos(toothWidth * 0.08));
        ctx.lineTo((r - dedendum) * Math.sin(toothWidth/2), (r - dedendum) * Math.cos(toothWidth/2));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Subtle pitch circle
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
}

function drawHelicalGear(ctx, r, numTeeth, color) {
    // Root circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
    ctx.fill();

    const toothAngle = (Math.PI * 2) / numTeeth;
    const addendum = r * 0.17;
    const dedendum = r * 0.23;
    const toothWidth = toothAngle * 0.38;
    const helixOffset = 0.18; // slant amount

    ctx.fillStyle = color;
    for (let i = 0; i < numTeeth; i++) {
        const rot = i * toothAngle;
        ctx.save();
        ctx.rotate(rot);

        ctx.beginPath();
        // Left flank (slanted)
        ctx.moveTo((r - dedendum) * Math.sin(-toothWidth/2), (r - dedendum) * Math.cos(-toothWidth/2));
        ctx.lineTo((r + addendum) * Math.sin(-toothWidth/2 - helixOffset), (r + addendum) * Math.cos(-toothWidth/2 - helixOffset));
        // Tip
        ctx.lineTo((r + addendum) * Math.sin(toothWidth/2 - helixOffset), (r + addendum) * Math.cos(toothWidth/2 - helixOffset));
        // Right flank (slanted)
        ctx.lineTo((r - dedendum) * Math.sin(toothWidth/2), (r - dedendum) * Math.cos(toothWidth/2));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
}

function drawBevelGear(ctx, r, numTeeth, color) {
    // Bevel gear - slightly conical appearance
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
    ctx.fill();

    const toothAngle = (Math.PI * 2) / numTeeth;
    const addendum = r * 0.20;
    const dedendum = r * 0.26;

    ctx.fillStyle = color;
    for (let i = 0; i < numTeeth; i++) {
        const rot = i * toothAngle;
        ctx.save();
        ctx.rotate(rot);

        // Tapered tooth (narrower at root)
        ctx.beginPath();
        ctx.moveTo((r - dedendum) * 0.6 * Math.sin(-0.12), (r - dedendum) * 0.6 * Math.cos(-0.12));
        ctx.lineTo((r + addendum) * Math.sin(-0.10), (r + addendum) * Math.cos(-0.10));
        ctx.lineTo((r + addendum) * Math.sin(0.10), (r + addendum) * Math.cos(0.10));
        ctx.lineTo((r - dedendum) * 0.6 * Math.sin(0.12), (r - dedendum) * 0.6 * Math.cos(0.12));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Outer bevel ring
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
    ctx.stroke();
}

function drawWormGear(ctx, r, numTeeth, color) {
    // Worm gear - elongated screw appearance
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.15, r * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thread lines (worm screw effect)
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2.5;
    const threads = 5;
    for (let t = 0; t < threads; t++) {
        ctx.beginPath();
        const offset = (t / threads) * Math.PI * 2;
        for (let i = -6; i <= 6; i++) {
            const x = (i * 4.5);
            const y = Math.sin(i * 0.9 + offset) * (r * 0.55);
            if (i === -6) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // End caps
    ctx.fillStyle = "#2a2a35";
    ctx.beginPath();
    ctx.ellipse(-r * 0.95, 0, 6, r * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r * 0.95, 0, 6, r * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawMiterGear(ctx, r, numTeeth, color) {
    // Miter gear: special bevel with 1:1 ratio, more "square" proportions
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.80, 0, Math.PI * 2);
    ctx.fill();

    const toothAngle = (Math.PI * 2) / numTeeth;
    const addendum = r * 0.16;
    const dedendum = r * 0.24;

    ctx.fillStyle = color;
    for (let i = 0; i < numTeeth; i++) {
        const rot = i * toothAngle;
        ctx.save();
        ctx.rotate(rot);

        // Shorter, wider teeth typical of miter gears
        ctx.beginPath();
        ctx.moveTo((r - dedendum) * 0.55 * Math.sin(-0.14), (r - dedendum) * 0.55 * Math.cos(-0.14));
        ctx.lineTo((r + addendum) * Math.sin(-0.12), (r + addendum) * Math.cos(-0.12));
        ctx.lineTo((r + addendum) * Math.sin(0.12), (r + addendum) * Math.cos(0.12));
        ctx.lineTo((r - dedendum) * 0.55 * Math.sin(0.14), (r - dedendum) * 0.55 * Math.cos(0.14));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Distinct outer ring
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.97, 0, Math.PI * 2);
    ctx.stroke();
}

function drawScrewGear(ctx, r, numTeeth, color) {
    // Screw / Crossed Helical gear - more aggressive slant
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
    ctx.fill();

    const toothAngle = (Math.PI * 2) / numTeeth;
    const addendum = r * 0.17;
    const dedendum = r * 0.23;
    const toothWidth = toothAngle * 0.36;
    const helixOffset = 0.28; // stronger cross angle

    ctx.fillStyle = color;
    for (let i = 0; i < numTeeth; i++) {
        const rot = i * toothAngle;
        ctx.save();
        ctx.rotate(rot);

        ctx.beginPath();
        ctx.moveTo((r - dedendum) * Math.sin(-toothWidth/2), (r - dedendum) * Math.cos(-toothWidth/2));
        ctx.lineTo((r + addendum) * Math.sin(-toothWidth/2 - helixOffset), (r + addendum) * Math.cos(-toothWidth/2 - helixOffset));
        ctx.lineTo((r + addendum) * Math.sin(toothWidth/2 - helixOffset), (r + addendum) * Math.cos(toothWidth/2 - helixOffset));
        ctx.lineTo((r - dedendum) * Math.sin(toothWidth/2), (r - dedendum) * Math.cos(toothWidth/2));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
}

function drawInternalGear(ctx, r, numTeeth, color) {
    // Internal gear: teeth on the inside of a ring (for planetary-like visuals)
    const outerR = r * 1.16;
    const innerR = r * 0.76;   // cutout radius

    // 1. Outer ring (filled)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, outerR, 0, Math.PI * 2);
    ctx.fill();

    // 2. Cutout (hole) rendered first
    ctx.fillStyle = "#f0f2f8";
    ctx.beginPath();
    ctx.arc(0, 0, innerR, 0, Math.PI * 2);
    ctx.fill();

    // 3. Teeth drawn AFTER cutout — base exactly at cutout radius (innerR), pointing inward
    const toothAngle = (Math.PI * 2) / numTeeth;
    const toothDepth = r * 0.18;           // deeper teeth
    const toothWidth = toothAngle * 0.76;  // minimal gaps
    const tipTaper = 0.15;

    ctx.fillStyle = color;
    for (let i = 0; i < numTeeth; i++) {
        const rot = i * toothAngle;
        ctx.save();
        ctx.rotate(rot);

        const baseR = innerR;                    // teeth base exactly at cutout radius
        const tipR  = innerR - toothDepth;       // tips point inward

        ctx.beginPath();
        ctx.moveTo(baseR * Math.sin(-toothWidth/2), baseR * Math.cos(-toothWidth/2));
        ctx.lineTo(tipR  * Math.sin(-toothWidth * tipTaper), tipR * Math.cos(-toothWidth * tipTaper));
        ctx.lineTo(tipR  * Math.sin( toothWidth * tipTaper), tipR * Math.cos( toothWidth * tipTaper));
        ctx.lineTo(baseR * Math.sin( toothWidth/2), baseR * Math.cos( toothWidth/2));
        ctx.closePath();
        ctx.fill();

        // Outline
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.lineWidth = 0.9;
        ctx.stroke();
        ctx.restore();
    }

    // Subtle outer rim
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, 0, outerR, 0, Math.PI * 2);
    ctx.stroke();
}

// ==================== CLOCK DRAWING ====================
function drawClockBase(ctx, cx, cy, r) {
    // Outer ring (clock base)
    ctx.fillStyle = "#3c372d";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#b4a078";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Inner face
    const innerR = r * 0.82;
    ctx.fillStyle = "#2d2a23";
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fill();

    // Hour marks
    ctx.strokeStyle = "#c8c0a0";
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI * 2 / 12) - Math.PI / 2;
        const len = (i % 3 === 0) ? 9 : 5.5;
        ctx.beginPath();
        ctx.moveTo(cx + (r - 13) * Math.cos(a), cy + (r - 13) * Math.sin(a));
        ctx.lineTo(cx + (r - 13 - len) * Math.cos(a), cy + (r - 13 - len) * Math.sin(a));
        ctx.stroke();
    }
}

function drawClockHands(ctx, cx, cy, r, simulationTime, clockRatio) {
    const t = simulationTime * clockRatio;

    // Second hand (fast)
    const secAng = ((t * 6) % 360 - 90) * Math.PI / 180;
    ctx.strokeStyle = "#c84444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (r - 16) * Math.cos(secAng), cy + (r - 16) * Math.sin(secAng));
    ctx.stroke();

    // Minute hand
    const minAng = ((t * 0.1) % 360 - 90) * Math.PI / 180;
    ctx.strokeStyle = "#e0d8c8";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (r - 26) * Math.cos(minAng), cy + (r - 26) * Math.sin(minAng));
    ctx.stroke();

    // Hour hand
    const hourAng = ((t * (0.1 / 12)) % 360 - 90) * Math.PI / 180;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (r - 38) * Math.cos(hourAng), cy + (r - 38) * Math.sin(hourAng));
    ctx.stroke();

    // Center cap
    ctx.fillStyle = "#b4a078";
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3c372d";
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
}

// Legacy wrapper (kept for compatibility)
function drawClock(ctx, cx, cy, r, simulationTime, clockRatio) {
    drawClockBase(ctx, cx, cy, r);
    drawClockHands(ctx, cx, cy, r, simulationTime, clockRatio);
}

// ==================== MAIN SIMULATION ====================
class Clockwork {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d", { alpha: true });
        this.gears = [];
        this.connections = [];
        this.connectionTypes = [];
        this.clockConnections = [];
        this.driverIdx = 0;
        this.baseOmega = 0.85;
        this.speedMult = 1.0;
        this.running = true;
        this.simulationTime = 0;
        this.selectedIdx = null;
        this.hoveredIdx = null;
        this.layerVisible = [true, true, true];
        this.currentPreset = "";
        this.clockRatio = 1.0;
        this.clockX = 520;
        this.clockY = 360;
        this.clockR = 78;
        this.showClockFace = true;

        this.setupEventListeners();
        this.loadPreset("Concept Evaluation");
        this.animate();
    }

    setupEventListeners() {
        const canvas = this.canvas;

        // Mouse move for hover + tooltip
        canvas.addEventListener("mousemove", (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            this.hoveredIdx = null;
            let found = false;

            for (let i = 0; i < this.gears.length; i++) {
                const g = this.gears[i];
                if (!g.visible) continue;
                const dist = Math.hypot(mx - g.x, my - g.y);
                if (dist < g.radius + 8) {
                    this.hoveredIdx = i;
                    found = true;

                    // Tooltip
                    const tooltip = document.getElementById("tooltip");
                    const m = METHODS[g.key];
                    tooltip.textContent = `${m.full} • ${m.phase}`;
                    tooltip.style.left = `${e.clientX + 12}px`;
                    tooltip.style.top = `${e.clientY + 8}px`;
                    tooltip.style.display = "block";
                    break;
                }
            }

            if (!found) {
                document.getElementById("tooltip").style.display = "none";
            }
        });

        canvas.addEventListener("mouseleave", () => {
            this.hoveredIdx = null;
            document.getElementById("tooltip").style.display = "none";
        });

        // Click to select
        canvas.addEventListener("click", (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            let clicked = false;
            for (let i = 0; i < this.gears.length; i++) {
                const g = this.gears[i];
                if (!g.visible) continue;
                if (Math.hypot(mx - g.x, my - g.y) < g.radius + 8) {
                    this.selectedIdx = i;
                    this.updateInfoPanel();
                    clicked = true;
                    break;
                }
            }
            if (!clicked) {
                this.selectedIdx = null;
                this.updateInfoPanel();
            }
        });

        // Mouse wheel for speed
        canvas.addEventListener("wheel", (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                this.setSpeed(this.speedMult + 0.15);
            } else {
                this.setSpeed(this.speedMult - 0.15);
            }
        }, { passive: false });

        // Keyboard
        document.addEventListener("keydown", (e) => {
            if (e.key === " " || e.key.toLowerCase() === "p") {
                e.preventDefault();
                this.toggleRun();
            }
            if (e.key.toLowerCase() === "r") {
                this.resetSimulation();
            }
            if (e.key === "1") this.loadPreset("Opportunity Recognition");
            if (e.key === "2") this.loadPreset("Problem Framing");
            if (e.key === "3") this.loadPreset("Solution Concepting");
            if (e.key === "4") this.loadPreset("Specification as Hypothesis");
            if (e.key === "5") this.loadPreset("Concept Evaluation");
        });

        // UI Buttons
        document.querySelectorAll(".preset-buttons button").forEach(btn => {
            btn.addEventListener("click", () => {
                const presetName = btn.dataset.preset;
                this.loadPreset(presetName);
                // Update active state
                document.querySelectorAll(".preset-buttons button").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
            });
        });

        document.getElementById("pauseBtn").addEventListener("click", () => this.toggleRun());
        document.getElementById("resetBtn").addEventListener("click", () => this.resetSimulation());

        document.getElementById("speedUp").addEventListener("click", () => this.setSpeed(this.speedMult + 0.2));
        document.getElementById("speedDown").addEventListener("click", () => this.setSpeed(this.speedMult - 0.2));

        // Layer checkboxes
        ["layer0", "layer1", "layer2"].forEach((id, idx) => {
            const cb = document.getElementById(id);
            cb.addEventListener("change", () => {
                this.layerVisible[idx] = cb.checked;
                this.updateGearVisibility();
            });
        });

        // Clock face toggle
        const clockToggle = document.getElementById("clockToggle");
        if (clockToggle) {
            clockToggle.addEventListener("change", () => {
                this.showClockFace = clockToggle.checked;
            });
        }
    }

    updateGearVisibility() {
        for (const g of this.gears) {
            g.visible = this.layerVisible[g.layer];
        }
        this.recomputeVelocities();
    }

    // Helper: Draw the central clock gear in dark brown (always on top of clock base)
    drawDarkBrownClockGear(ctx, g) {
        const cx = g.x;
        const cy = g.y;
        const r = g.radius;
        const numTeeth = g.numTeeth;
        const angle = g.angle;

        const darkBrown = "#3a2f1f";   // Dark brown color for clock gear
        const highlightBrown = "#5c4630";

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        // Root circle (main body) - dark brown
        ctx.fillStyle = darkBrown;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
        ctx.fill();

        // Teeth - dark brown with subtle highlight
        const toothAngle = (Math.PI * 2) / numTeeth;
        const addendum = r * 0.18;
        const dedendum = r * 0.22;
        const toothWidth = toothAngle * 0.42;

        ctx.fillStyle = darkBrown;
        for (let i = 0; i < numTeeth; i++) {
            const rot = i * toothAngle;
            ctx.save();
            ctx.rotate(rot);

            ctx.beginPath();
            ctx.moveTo((r - dedendum) * Math.sin(-toothWidth/2), (r - dedendum) * Math.cos(-toothWidth/2));
            ctx.lineTo((r + addendum) * Math.sin(-toothWidth * 0.08), (r + addendum) * Math.cos(-toothWidth * 0.08));
            ctx.lineTo((r + addendum) * Math.sin(toothWidth * 0.08), (r + addendum) * Math.cos(toothWidth * 0.08));
            ctx.lineTo((r - dedendum) * Math.sin(toothWidth/2), (r - dedendum) * Math.cos(toothWidth/2));
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // Subtle pitch circle
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // Axle (darker)
        ctx.fillStyle = "#1a140f";
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#8a6f4a";
        ctx.beginPath();
        ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }

    loadPreset(key) {
        if (!PRESETS[key]) key = "Concept Evaluation";
        const p = PRESETS[key];

        this.gears = [];
        for (const gdata of p.gears) {
            const m = METHODS[gdata.key];
            this.gears.push({
                x: gdata.x,
                y: gdata.y,
                radius: gdata.radius,
                numTeeth: gdata.numTeeth,
                key: gdata.key,
                label: gdata.key.substring(0, 6),
                layer: gdata.layer,
                type: gdata.type || "spur",
                beta: gdata.beta || 0,
                angle: gdata.beta || 0,
                omega: 0,
                visible: this.layerVisible[gdata.layer] ?? true
            });
        }

        this.connections = p.connections;
        this.connectionTypes = (p.connectionTypes && p.connectionTypes.length === p.connections.length) 
            ? p.connectionTypes 
            : p.connections.map(() => "drive");
        this.clockConnections = p.clockConnections || [];
        this.driverIdx = p.driverIdx;
        this.clockRatio = p.clockRatio || 1.0;
        this.currentPreset = key;
        this.simulationTime = 0;
        this.selectedIdx = null;

        this.recomputeVelocities();
        this.updateInfoPanel();
        this.updatePresetButtons();
        this.updateStatus();
    }

    updatePresetButtons() {
        document.querySelectorAll(".preset-buttons button").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.preset === this.currentPreset);
        });
    }

    recomputeVelocities() {
        for (const g of this.gears) g.omega = 0;
        if (this.gears.length === 0) return;

        this.gears[this.driverIdx].omega = this.baseOmega * this.speedMult;

        const visited = new Set([this.driverIdx]);
        const queue = [this.driverIdx];

        while (queue.length > 0) {
            const curr = queue.shift();
            for (const [a, b] of this.connections) {
                let other = null;
                if (a === curr) other = b;
                else if (b === curr) other = a;
                if (other === null || visited.has(other)) continue;

                const r1 = this.gears[curr].radius;
                const r2 = this.gears[other].radius;
                // All gears are external in this visualization
                const sgn = -1;
                this.gears[other].omega = sgn * (r1 / Math.max(r2, 0.1)) * this.gears[curr].omega;
                visited.add(other);
                queue.push(other);
            }
        }
    }

    setSpeed(mult) {
        this.speedMult = Math.max(0.2, Math.min(3.5, mult));
        this.recomputeVelocities();
        document.getElementById("speedValue").textContent = this.speedMult.toFixed(1) + "×";
    }

    toggleRun() {
        this.running = !this.running;
        this.updateStatus();
    }

    resetSimulation() {
        this.simulationTime = 0;
        for (const g of this.gears) {
            g.angle = g.beta || 0;
        }
    }

    updateStatus() {
        const statusEl = document.getElementById("status");
        const pauseBtn = document.getElementById("pauseBtn");

        if (this.running) {
            statusEl.textContent = "RUNNING";
            statusEl.className = "status running";
            pauseBtn.textContent = "⏸ Pause";
        } else {
            statusEl.textContent = "PAUSED";
            statusEl.className = "status paused";
            pauseBtn.textContent = "▶ Resume";
        }
    }

    updateInfoPanel() {
        const container = document.getElementById("infoContent");

        if (this.selectedIdx === null || this.selectedIdx >= this.gears.length) {
            container.innerHTML = `<p class="placeholder">Click any gear to see its role in the design process.</p>`;
            return;
        }

        const g = this.gears[this.selectedIdx];
        const m = METHODS[g.key];

        container.innerHTML = `
            <h4>${m.full}</h4>
            <div class="phase">${m.phase}</div>
            <div class="desc">${m.desc}</div>
            <div class="insight-label">From reflection:</div>
            <div class="insight">${m.insight}</div>
        `;
    }

    update(dt) {
        if (!this.running) return;

        this.simulationTime += dt * this.baseOmega * this.speedMult;

        for (const g of this.gears) {
            if (g.visible) {
                g.angle = (g.angle + g.omega * dt) % (Math.PI * 2);
            }
        }
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Background
        ctx.fillStyle = "#f8f9fc";
        ctx.fillRect(0, 0, w, h);

        // Main mechanism area
        ctx.fillStyle = "#f0f2f8";
        ctx.fillRect(120, 60, 780, 600);
        ctx.strokeStyle = "#b4b9c4";
        ctx.lineWidth = 2;
        ctx.strokeRect(120, 60, 780, 600);

        // When the clock face is hidden, draw the central dark gear *early*
        // so it renders behind all the mechanism gears and connections.
        // It remains visible as a subtle background element but never covers
        // important information.
        if (!this.showClockFace) {
            const centralGear = {
                x: this.clockX,
                y: this.clockY,
                radius: this.clockR * 0.55,
                numTeeth: 22,
                angle: this.simulationTime * 0.6,
                layer: 1,
                label: null,
                type: "helical"
            };
            this.drawDarkBrownClockGear(ctx, centralGear);
        }

        // Draw gears by layer
        for (let layer = 0; layer < 3; layer++) {
            if (!this.layerVisible[layer]) continue;
            for (let i = 0; i < this.gears.length; i++) {
                const g = this.gears[i];
                if (g.layer === layer && g.visible) {
                    const highlight = (i === this.hoveredIdx || i === this.selectedIdx);
                    drawGear(ctx, g, highlight);
                }
            }
        }

        // Connection lines (color-coded by relational type from Connection Key)
        const connColors = {
            "drive": "#5088d0",      // blue - forward drive
            "feedback": "#e07a5f",   // coral - loops back
            "synthesis": "#81b29a"   // green gradient feel (solid here)
        };
        ctx.lineWidth = 1.8;
        for (let i = 0; i < this.connections.length; i++) {
            const [a, b] = this.connections[i];
            const g1 = this.gears[a];
            const g2 = this.gears[b];
            if (g1.visible && g2.visible) {
                const type = this.connectionTypes[i] || "drive";
                ctx.strokeStyle = connColors[type] || "#9aa0ad";
                if (type === "feedback") {
                    ctx.setLineDash([5, 3]);
                } else {
                    ctx.setLineDash([]);
                }
                ctx.beginPath();
                ctx.moveTo(g1.x, g1.y);
                ctx.lineTo(g2.x, g2.y);
                ctx.stroke();
            }
        }
        ctx.setLineDash([]);

        // Clock output connections (purely visual links from final method steps to central clock)
        // These represent how the phase culminates in the "tick" of validated progress
        if (this.clockConnections && this.clockConnections.length > 0) {
            ctx.strokeStyle = "#c37337";
            ctx.lineWidth = 2.2;
            ctx.setLineDash([7, 4]);
            for (const idx of this.clockConnections) {
                if (idx < this.gears.length) {
                    const g = this.gears[idx];
                    if (g && g.visible) {
                        ctx.beginPath();
                        ctx.moveTo(g.x, g.y);
                        ctx.lineTo(this.clockX, this.clockY);
                        ctx.stroke();
                        // Small accent dot at clock end
                        ctx.fillStyle = "#c37337";
                        ctx.beginPath();
                        ctx.arc(this.clockX, this.clockY, 4.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
            ctx.setLineDash([]);
        }

        // === Central Clock Area ===
        if (this.showClockFace) {
            // 1. Draw clock base (face + hour markings)
            drawClockBase(ctx, this.clockX, this.clockY, this.clockR);

            // 2. Draw dark brown central gear (in front of base, behind hands)
            const centralGear = {
                x: this.clockX,
                y: this.clockY,
                radius: this.clockR * 0.55,
                numTeeth: 22,
                angle: this.simulationTime * 0.6,
                layer: 1,
                label: null,
                type: "helical"
            };
            // Draw dark brown clock gear (in front of base, behind hands)
            this.drawDarkBrownClockGear(ctx, centralGear);

            // 3. Draw clock hands on top
            drawClockHands(ctx, this.clockX, this.clockY, this.clockR, this.simulationTime, this.clockRatio);
        }

        // Small title inside canvas area
        ctx.fillStyle = "#222";
        ctx.font = "bold 15px system-ui, sans-serif";
        ctx.fillText("DESIGN METHODS CLOCKWORK", 140, 85);

        ctx.fillStyle = "#5088d0";
        ctx.font = "13px system-ui, sans-serif";
        ctx.fillText(PRESETS[this.currentPreset]?.name || "", 140, 105);
    }

    animate() {
        const now = performance.now();
        if (!this.lastTime) this.lastTime = now;
        const dt = Math.min((now - this.lastTime) / 1000, 0.1); // cap dt
        this.lastTime = now;

        this.update(dt);
        this.draw();

        // Update status color if needed
        requestAnimationFrame(() => this.animate());
    }
}

// ==================== BOOTSTRAP ====================

// ==================== DESIGNER'S NOTE POPUP ====================
let designerNoteShown = localStorage.getItem('designerNoteShown') === 'true';

function createDesignerNoteModal() {
    if (document.getElementById('designerNoteModal')) return;

    const modalHTML = `
    <div id="designerNoteModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 10000; opacity: 0; transition: opacity 0.3s ease;">
        <div style="background: white; max-width: 620px; width: 90%; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); padding: 28px 32px; position: relative; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <button onclick="closeDesignerNoteModal()" style="position: absolute; top: 16px; right: 20px; background: none; border: none; font-size: 28px; cursor: pointer; color: #666; line-height: 1;">×</button>
            
            <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #222; text-align: center;">Designer's Note</h2>
            
            <div style="line-height: 1.65; font-size: 15.2px; color: #333; max-height: 420px; overflow-y: auto; padding-right: 8px;">
                ${`The organizing metaphor for this artifact is a clockwork mechanism. Just as the precise meshing of gears, springs, and hands in a clock produces accurate time, the thoughtful interconnection of design methods generates reliable output. Each gear in this visualization represents a distinct method whose unique mechanical character, whether direct like a spur or gradual like a helical, determines how it engages with and influences others. Their collective motion, ratios, and timing illustrate how early observations propel framing, ideation feeds specification, and evaluation loops back into insights. The central clock embodies the iterative process's final result, a fine piece of work.
Overall, when methods align and drive one another effectively, the result goes from non-functional and chaos to clarity: a clear, measured “tick” of progress, the validated decisions, and effective conclusions. This visualization is about that concept.`}
            </div>
            
            <div style="text-align: center; margin-top: 24px;">
                <button onclick="closeDesignerNoteModal()" style="background: #5088d0; color: white; border: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; cursor: pointer; font-weight: 600;">Got it — Start Exploring</button>
            </div>
        </div>
    </div>`;

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);

    // Fade in
    setTimeout(() => {
        const modal = document.getElementById('designerNoteModal');
        if (modal) modal.style.opacity = '1';
    }, 10);

    // Click outside to close
    const modal = document.getElementById('designerNoteModal');
    modal.addEventListener('click', (e) => {
        if (e.target.id === 'designerNoteModal') closeDesignerNoteModal();
    });
}

function closeDesignerNoteModal() {
    const modal = document.getElementById('designerNoteModal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
        }, 300);
    }
    localStorage.setItem('designerNoteShown', 'true');
}

function showDesignerNote() {
    createDesignerNoteModal();
}

// Add reopen button to STATUS panel (called after Clockwork init)
function addReopenButton() {
    const statusPanel = document.querySelector('.sidebar.right .panel:last-child');
    if (!statusPanel) return;
    
    const reopenBtn = document.createElement('button');
    reopenBtn.textContent = '📖 Designer\'s Note';
    reopenBtn.style.cssText = 'margin-top: 12px; width: 100%; padding: 10px; background: white; border: 1px solid #d0d5df; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; color: #222;';
    reopenBtn.addEventListener('click', showDesignerNote);
    reopenBtn.addEventListener('mouseover', () => reopenBtn.style.background = '#e8f0fe');
    reopenBtn.addEventListener('mouseout', () => reopenBtn.style.background = 'white');
    statusPanel.appendChild(reopenBtn);
}

// Auto-show popup once on first load
window.addEventListener('load', () => {
    setTimeout(() => {
        if (!designerNoteShown) {
            createDesignerNoteModal();
            designerNoteShown = true;
        }
    }, 800);
});


window.addEventListener("load", () => {
    const canvas = document.getElementById("canvas");
    const cw = new Clockwork(canvas);

    // Set initial speed display
    document.getElementById("speedValue").textContent = cw.speedMult.toFixed(1) + "×";

    // Make it globally accessible for debugging if needed
    window.clockwork = cw;

    console.log("%c[Clockwork] Browser version initialized successfully", "color:#888");

    // Create Designer's Note Modal
    const modalHTML = `
<div id="designersNoteModal" class="modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.65); z-index: 10000; align-items: center; justify-content: center;">
  <div style="background: white; max-width: 540px; width: 92%; border-radius: 12px; box-shadow: 25px 25px 50px -12px rgb(0 0 0 / 0.25); overflow: hidden; max-height: 92vh; display: flex; flex-direction: column;">
    <div style="padding: 20px 24px 12px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
      <h2 style="margin: 0; font-size: 23px; font-weight: 600; color: #222;">Designer's Note</h2>
      <button id="modalCloseX" style="background: none; border: none; font-size: 32px; line-height: 1; color: #999; cursor: pointer; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">×</button>
    </div>
    <div style="padding: 24px 28px; font-size: 15.1px; line-height: 1.68; color: #333; overflow-y: auto; flex: 1;">
      <p>The organizing metaphor for this artifact is a clockwork mechanism. Just as the precise meshing of gears, springs, and hands in a clock produces accurate time, the thoughtful interconnection of design methods generates reliable output. Each gear in this visualization represents a distinct method whose unique mechanical character, whether direct like a spur or gradual like a helical, determines how it engages with and influences others. Their collective motion, ratios, and timing illustrate how early observations propel framing, ideation feeds specification, and evaluation loops back into insights. The central clock embodies the iterative process's final result, a fine piece of work.</p>
      <p style="margin-top: 18px;">Overall, when methods align and drive one another effectively, the result goes from non-functional and chaos to clarity: a clear, measured “tick” of progress, the validated decisions, and effective conclusions. This visualization is about that concept.</p>
    </div>
    <div style="padding: 20px 28px; background: #f8f9fc; border-top: 1px solid #e5e7eb; text-align: right; flex-shrink: 0;">
      <button id="modalGotIt" style="background: #5088d0; color: white; border: none; padding: 13px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer;">Got it — Start Exploring</button>
    </div>
  </div>
</div>`;
    
    // Inject modal
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);

    const modal = document.getElementById('designersNoteModal');
    
    function showModal() {
        modal.style.display = 'flex';
    }
    
    function hideModal() {
        modal.style.display = 'none';
    }

    // Close buttons
    document.getElementById('modalCloseX').addEventListener('click', hideModal);
    document.getElementById('modalGotIt').addEventListener('click', hideModal);
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideModal();
    });

    // Show on first load
    if (!localStorage.getItem('designersNoteSeen')) {
        setTimeout(() => {
            showModal();
            localStorage.setItem('designersNoteSeen', 'true');
        }, 800);
    }

    // Reopen button
    const showNoteBtn = document.getElementById('showNoteBtn');
    if (showNoteBtn) {
        showNoteBtn.addEventListener('click', showModal);
    }


});


// ==================== DESIGNER'S NOTE POPUP ====================
