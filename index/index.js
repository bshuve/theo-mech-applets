// Applets data - simplified without categories
const appletsData = [
    {
        id: "orbit/orbit1",
        title: "Orbital Mechanics",
        description: "Visualize planetary orbits with adjustable parameters. Explore Kepler's laws and orbital dynamics.",
        icon: "fas fa-globe-americas"
    },
    {
        id: "cycloid-applet/cycloid",
        title: "Cycloid Motion",
        description: "Explore the brachistochrone problem and cycloid curves - the path of fastest descent.",
        icon: "fas fa-wave-square"
    },
    {
        id: "traj/trajectory1",
        title: "Projectile Trajectories",
        description: "Simulate projectile motion with air resistance. Compare trajectories with different parameters.",
        icon: "fas fa-project-diagram"
    },
    {
        id: "lagrangian/lagrangian0",
        title: "Lagrangian Mechanics",
        description: "Interactive visualization of Lagrangian formalism with constraints and generalized coordinates.",
        icon: "fas fa-calculator"
    },
    {
        id: "lagrangian-multipliers/mult1",
        title: "Lagrangian Multipliers",
        description: "Understand constraint forces through Lagrange multipliers with interactive graphs.",
        icon: "fas fa-chart-line"
    },
    {
        id: "rhr-applet/rhr1",
        title: "Right-Hand Rule",
        description: "Interactive guide to the right-hand rule for cross products and magnetic forces.",
        icon: "fas fa-hand-point-right"
    },
    {
        id: "force-energy/force-energy1",
        title: "Force & Energy Relationships",
        description: "Explore the relationship between conservative forces and potential energy functions.",
        icon: "fas fa-bolt"
    },
    {
        id: "global-local-applet/global-local1",
        title: "Global vs Local Minima",
        description: "Visualize optimization landscapes and understand the difference between local and global minima.",
        icon: "fas fa-mountain"
    },
    {
        id: "misc-applets",
        title: "Miscellaneous Applets",
        description: "Collection of smaller physics applets covering various topics in mechanics and waves.",
        icon: "fas fa-shapes"
    }
];

// Function to render applets
function renderApplets(applets) {
    const container = document.getElementById('appletsContainer');
    container.innerHTML = '';
    
    applets.forEach(applet => {
        const card = document.createElement('div');
        card.className = 'applet-card';
        
        card.innerHTML = `
            <div class="applet-image">
                ${applet.image ? 
                    `<img src="${applet.image}" alt="${applet.title}" />` : 
                    `<i class="${applet.icon}"></i>`
                }
            </div>
            <div class="applet-content">
                <h3 class="applet-title">${applet.title}</h3>
                <p class="applet-description">${applet.description}</p>
                <a href="../${applet.id}.html" class="btn"><i class="fas fa-play"></i> Launch</a>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    renderApplets(appletsData);
    
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filteredApplets = appletsData.filter(applet => 
            applet.title.toLowerCase().includes(searchTerm) || 
            applet.description.toLowerCase().includes(searchTerm)
        );
        renderApplets(filteredApplets);
    });
});