const forestGrid = document.getElementById("forest-grid");

const TREE_EMOJIS = {
  oak: "🌳",
  pine: "🌲",
  cherry: "🌸",
  palm: "🌴",
  cactus: "🌵",
  maple: "🍁",
  bamboo: "🎋",
  bonsai: "🪴"
};


const sessions =
  JSON.parse(localStorage.getItem("focusSessions")) || [];

const successfulSessions = sessions.filter(
  s => s.success === true
);

if (successfulSessions.length === 0) {
  forestGrid.innerHTML =
    "<p class='plant-status'>No trees yet. Start focusing 🌱</p>";
} else {
  successfulSessions.forEach(session => {
    const tree = document.createElement("div");
    tree.className = "forest-tree";
    tree.textContent = TREE_EMOJIS[session.treeType] || "🌳";
    forestGrid.appendChild(tree);
  });
}
