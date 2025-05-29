document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const g = 9.81;
    const dt = 0.01;
    const TRANSITION_MS = 300;
    
    // DOM Elements
    const cxSlider = document.getElementById('slide-x-coord');
    const cySlider = document.getElementById('slide-y-coord');
    const showCycloidBtn = document.getElementById('show-cycloid');
    const optimizeBtn = document.getElementById('optimize-cy');
    const spinner = document.getElementById('optimize-spinner');
    
    // State
    let cx = parseInt(cxSlider.value);
    let cy = parseInt(cySlider.value);
    let cycloidVisible = false;
    
    // Precompute data for performance
    const allIntegralData = computeAllIntegralData();
    
    // Initialize D3 plots
    const integralPlot = initIntegralPlot();
    
    // Event Listeners
    cxSlider.addEventListener('input', handleCxChange);
    cySlider.addEventListener('input', handleCyChange);
    showCycloidBtn.addEventListener('click', toggleCycloid);
    optimizeBtn.addEventListener('click', optimizeCy);
    
    // Initialize view
    updateView();
    
    // ---- Core Functions ----
    
    function handleCxChange() {
        cx = parseInt(cxSlider.value);
        updateView();
        updateIntegralPlot();
    }
    
    function handleCyChange() {
        cy = parseInt(cySlider.value);
        updateView();
        updateIntegralPlot();
    }
    
    function toggleCycloid() {
        cycloidVisible = !cycloidVisible;
        const cycloidPath = document.getElementById('cycloid');
        
        if (cycloidVisible) {
            cycloidPath.setAttribute('d', 'M0 0 C 60 80 180 120 250 160');
            showCycloidBtn.textContent = 'Hide Cycloid';
        } else {
            cycloidPath.setAttribute('d', '');
            showCycloidBtn.textContent = 'Show Cycloid';
        }
    }
    
    function optimizeCy() {
        spinner.style.display = 'inline-block';
        optimizeBtn.disabled = true;
        
        setTimeout(() => { // Allow UI to update
            let bestCy = 0;
            let bestTime = Infinity;
            
            for (let testCy = 0; testCy <= 300; testCy++) {
                const currentTime = allIntegralData[cx][testCy].y;
                if (currentTime < bestTime) {
                    bestTime = currentTime;
                    bestCy = testCy;
                }
            }
            
            cySlider.value = bestCy;
            cy = bestCy;
            updateView();
            updateIntegralPlot();
            
            spinner.style.display = 'none';
            optimizeBtn.disabled = false;
        }, 50);
    }
    
    function updateView() {
        // Update control point
        document.getElementById('control-point').setAttribute('cx', cx);
        document.getElementById('control-point').setAttribute('cy', cy);
        
        // Update curve
        document.getElementById('curve').setAttribute('d', `M 0 0 Q ${cx} ${cy} 250 160`);
        
        // Update lines
        document.getElementById('start-to-control').setAttribute('d', `M 0 0 L ${cx} ${cy}`);
        document.getElementById('end-to-control').setAttribute('d', `M 250 160 L ${cx} ${cy}`);
        
        // Update displayed values
        document.getElementById('print-x-coord').textContent = cx;
        document.getElementById('print-y-coord').textContent = cy;
        document.getElementById('print-time').textContent = allIntegralData[cx][cy].y.toFixed(4);
    }
    
    function computeAllIntegralData() {
        const data = [];
        for (let cx = 0; cx <= 300; cx++) {
            const row = [];
            for (let cy = 0; cy <= 300; cy++) {
                row.push({ x: cy, y: calculateTimeIntegral(cx, cy) });
            }
            data.push(row);
        }
        return data;
    }
    
    function calculateTimeIntegral(cx, cy) {
        let integral = 0;
        for (let t = dt; t <= 1; t += dt) {
            const y = cy + (1-t)**2 * (0-cy) + t**2 * (160-cy);
            const dy_dt = 2*(1-t)*(cy-0) + 2*t*(160-cy);
            const dx_dt = 2*(1-t)*(cx-0) + 2*t*(250-cx);
            integral += Math.sqrt(dx_dt**2 + dy_dt**2) / Math.sqrt(y) * dt;
        }
        return integral / Math.sqrt(2 * g);
    }
    
    function initIntegralPlot() {
        // Set up dimensions and margins
        const margin = { top: 20, right: 30, bottom: 50, left: 60 };
        const width = 400 - margin.left - margin.right;
        const height = 320 - margin.top - margin.bottom;
    
        // Create SVG container
        const svg = d3.select("#integral-graphs")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    
        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, 300])  // cy range
            .range([0, width]);
    
        const yScale = d3.scaleLinear()
            .range([height, 0]);
    
        // Add axes
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale));
    
        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(yScale));
    
        // Add axis labels
        svg.append("text")
            .attr("class", "x-label")
            .attr("text-anchor", "end")
            .attr("x", width)
            .attr("y", height + margin.top + 20)
            .text("Control point y-coordinate (cy)");
    
        svg.append("text")
            .attr("class", "y-label")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 20)
            .attr("x", -margin.top)
            .text("Time (s)");
    
        // Create line generator
        const line = d3.line()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y));
    
        // Add line path
        svg.append("path")
            .attr("class", "integral-line")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5);
    
        // Add current point marker
        svg.append("circle")
            .attr("class", "current-point")
            .attr("r", 5)
            .attr("fill", "red");
    
        return {
            svg, xScale, yScale, line
        };
    }
    
    function updateIntegralPlot() {
        // Get data for current cx
        const currentData = allIntegralData[cx];
        
        // Update y-scale domain
        const maxTime = d3.max(currentData, d => d.y);
        integralPlot.yScale.domain([0, maxTime * 1.1]);  // Add 10% padding
        
        // Update line
        integralPlot.svg.select(".integral-line")
            .datum(currentData)
            .transition()
            .duration(TRANSITION_MS)
            .attr("d", integralPlot.line);
        
        // Update y-axis
        integralPlot.svg.select(".y-axis")
            .transition()
            .duration(TRANSITION_MS)
            .call(d3.axisLeft(integralPlot.yScale));
        
        // Update current point
        const currentPoint = currentData.find(d => d.x === cy) || currentData[cy];
        integralPlot.svg.select(".current-point")
            .transition()
            .duration(TRANSITION_MS)
            .attr("cx", integralPlot.xScale(cy))
            .attr("cy", integralPlot.yScale(currentPoint.y));
    }
    function optimizeCy() {
        spinner.style.display = 'inline-block';
        optimizeBtn.disabled = true;
        
        // Use requestAnimationFrame for smoother UI updates
        requestAnimationFrame(() => {
            let bestCy = 0;
            let bestTime = Infinity;
            
            // Check if cycloid is visible for comparison
            const cycloidVisible = document.getElementById('cycloid').getAttribute('d') !== '';
            
            // Find optimal cy for current cx
            for (let testCy = 0; testCy <= 300; testCy++) {
                const currentTime = allIntegralData[cx][testCy].y;
                if (currentTime < bestTime) {
                    bestTime = currentTime;
                    bestCy = testCy;
                }
            }
            
            // Update UI
            cySlider.value = bestCy;
            cy = bestCy;
            updateView();
            updateIntegralPlot();
            
            // If cycloid is visible, compare times
            if (cycloidVisible) {
                const cycloidTime = calculateCycloidTime();
                const improvement = ((bestTime - cycloidTime)/cycloidTime * 100).toFixed(1);
                console.log(`Optimized time: ${bestTime.toFixed(4)}s | Cycloid time: ${cycloidTime.toFixed(4)}s (${improvement}% difference)`);
            }
            
            spinner.style.display = 'none';
            optimizeBtn.disabled = false;
        });
    }
    
    function calculateCycloidTime() {
        // This should match your cycloid's actual time calculation
        // For a true cycloid between (0,0) and (250,160):
        const a = 160/(2*Math.PI); // Radius of generating circle
        const theta = 250/a; // Final angle
        return Math.sqrt(a/g) * theta; // Time for cycloid
    }
});