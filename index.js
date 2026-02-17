// Theoretical Mechanics applets
const theoreticalApplets = [
    {
        id: "traj/trajectory1",
        title: "Principle of Least Action",
        description: "What does it mean for the classical path to minimize the action? Why is the Lagrangian kinetic minus potential energy? Explore classical and alternative paths in a simple model of uniform gravity.",
        icon: "fas fa-project-diagram"
    },
    {
        id: "trajectory-with-arrows/trajectory-supplement",
        title: "Newton's 2nd Law and Least Action",
        description: "Visually compare the force and acceleration for classical and alternate trajectories, and see that Newton's Second Law only holds for the path of least action.",
        icon: "fas fa-arrows-alt"
    },
    {
        id: "global-local-applet/version-2.0/global-local-1-style",
        title: "Minimizing the Action, Locally and Globally",
        description: "The Principle of Least Action says that the classical path minimizes the action between fixed endpoints. This global principle, however, leads to a local equation of motion at each point. Explore the connection between globally and locally minimizing the action.",
        icon: "fas fa-mountain"
    },
    {
        id: "force-energy/force-energy1",
        title: "Action and the Euler-Lagrange Equations",
        description: "Explore what it means for a path to satisfy the Euler-Lagrange equation, and the connection to the action.",
        icon: "fas fa-bolt"
    },
    {
        id: "lagrangian/lagrangian0",
        title: "Generalized Coordinates and Coordinate Transformations",
        description: "Changing coordinates does not change the action, but it does change the functional form of the Lagrangian and the equations of motion. Use a 1D generalized coordinate transformation to understand what changes, and what doesn't, in different coordinate systems.",
        icon: "fas fa-calculator"
    },
    {
        id: "orbit/orbit1",
        title: "Orbital Motion and the Effective 1D Problem",
        description: "Explore two-body motion and its relation to the effective 1D problem that is used to characterize such systems. What is effective potential, and how does it relate to true potential energy? How are the 1D and 3D motions related?",
        icon: "fas fa-globe-americas"
    },
    {
        id: "cycloid-applet/cycloid1",
        title: "The Brachistochrone Problem and Cycloid Motion",
        description: "The brachistochrone problem is one of the classic problems in the calculus of variations. Explore the brachistochrone problem in more detail and see how a cycloid trajectory can be derived from the principle of least time.",
        icon: "fas fa-bicycle"
    }
];

// Introductory Mechanics applets
const introductoryApplets = [
    {
        id: "rhr-applet/rhr1",
        title: "Right-Hand Rule Practice",
        description: "Practice the right-hand rule for orbital angular momentum and torque in Newtonian mechanics.",
        icon: "fas fa-hand-point-right"
    }
];

// Function to render applets
function renderApplets(applets, containerId) {
    const container = document.getElementById(containerId);
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
                <a href="${applet.id}.html" class="btn"><i class="fas fa-play"></i> Launch</a>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    renderApplets(theoreticalApplets, 'theoreticalContainer');
    renderApplets(introductoryApplets, 'introductoryContainer');
});
