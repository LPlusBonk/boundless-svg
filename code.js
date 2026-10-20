// Boundless SVG
//
// For each selected node, exports SVG with useAbsoluteBounds: true.
// This forces Figma to use the node's own declared width/height as the
// export canvas (viewBox + width/height attrs), instead of shrinking or
// growing the viewBox to fit the tight bounding box of visible geometry.
// Overflowing geometry is preserved in the path data and will render
// unclipped in any standards-compliant SVG renderer (default root <svg>
// overflow is 'visible').
//
// contentsOnly must stay true — it controls whether OTHER, unrelated
// overlapping layers elsewhere on the canvas get pulled into the export.
// (useAbsoluteBounds expands the node's exported "area" to its full
// absolute position, so contentsOnly:false was sweeping in background
// boards/frames that happened to overlap that expanded region.)

figma.showUI(__html__, { width: 420, height: 520 });

async function run() {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({
      type: "error",
      message:
        "Select one or more frames/components (the icon containers) first.",
    });
    return;
  }

  const results = [];

  for (const node of selection) {
    if (!("width" in node) || !("height" in node)) {
      results.push({
        name: node.name,
        error:
          "Node has no width/height — select a frame, component, or group.",
      });
      continue;
    }

    try {
      const svg = await node.exportAsync({
        format: "SVG_STRING",
        useAbsoluteBounds: true, // lock canvas to the node's own frame size
        contentsOnly: true, // exclude unrelated overlapping layers
        svgOutlineText: false,
      });

      results.push({
        name: node.name,
        width: node.width,
        height: node.height,
        svg,
      });
    } catch (err) {
      results.push({ name: node.name, error: String(err) });
    }
  }

  figma.ui.postMessage({ type: "results", results });
}

// Initial run + auto re-run whenever the selection changes
run();
figma.on("selectionchange", run);

figma.ui.onmessage = (msg) => {
  if (msg.type === "close") {
    figma.closePlugin();
  }
  if (msg.type === "resize") {
    figma.ui.resize(msg.width, msg.height);
  }
};
