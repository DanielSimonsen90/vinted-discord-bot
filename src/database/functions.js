var categoryMap = {};

// Helper function to recursively build the catalog map
function buildCategoryMap(node, parentMap = {}) {
  if (node.id) {
    const nodeId = String(node.id);
    parentMap[nodeId] = parentMap[nodeId] || [];
    parentMap[nodeId].push(nodeId); // Include the current node ID in its own list of children
  }
  if (node.catalogs && Array.isArray(node.catalogs)) {
    node.catalogs.forEach((child) => {
      const childId = String(child.id);
      const parentId = String(node.id);
      buildCategoryMap(child, parentMap);
      parentMap[parentId] = parentMap[parentId].concat(parentMap[childId] || []);
    });
  }
  return parentMap;
}

// Build the category map starting from the root nodes
export function buildCategoryMapFromRoots(roots) {
  roots.data.catalogs.forEach((root) => {
    buildCategoryMap(root, categoryMap);
  });
}

export function isSubcategory(parentId, childId) {
  parentId = String(parentId);
  childId = String(childId);
  return categoryMap[parentId]?.includes(childId) ?? false;
}