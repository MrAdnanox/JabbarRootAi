export function initGraph(graphData, vscode) {
    const view = document.getElementById('graph-view');
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
        view.innerHTML = `<div class="card"><p>Aucun graphe de connaissance promu n'a été trouvé pour ce projet. Lancez l'analyse 'Ordo Ab Chaos'.</p></div>`;
        return;
    }

    const width = view.clientWidth;
    const height = Math.max(600, window.innerHeight - 200);

    const svg = d3.select('#knowledge-graph')
        .attr('width', '100%')
        .attr('height', height)
        .call(d3.zoom().on("zoom", (event) => g.attr("transform", event.transform)));

    const g = svg.append("g");

    const simulation = d3.forceSimulation(graphData.nodes)
        .force("link", d3.forceLink(graphData.edges).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-150))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const link = g.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(graphData.edges)
        .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value || 1));

    const node = g.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(graphData.nodes)
        .join("circle")
        .attr("r", 5)
        .attr("fill", d => d.type === 'File' ? '#f59e0b' : '#10b981')
        .call(drag(simulation));

    node.append("title")
        .text(d => `${d.label} (${d.type})`);

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    });

    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        
        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        
        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }
        
        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    d3.select('#zoom-out').on('click', () => {
        svg.transition().call(zoom.scaleBy, 0.7);
    });

    d3.select('#reset-view').on('click', () => {
        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity);
    });

    // Fonction de glisser-déposer pour les nœuds du graphe
    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        
        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        
        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }
        
        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }

    // Gérer le redimensionnement de la fenêtre
    const handleResize = () => {
        const newWidth = view.clientWidth;
        const newHeight = Math.max(600, window.innerHeight - 200);
        
        svg.attr('width', newWidth)
           .attr('height', newHeight)
           .attr('viewBox', [0, 0, newWidth, newHeight]);
        
        simulation.force('center')
                 .x(newWidth / 2)
                 .y(newHeight / 2);
        
        simulation.alpha(0.3).restart();
    };

    // Ajouter l'écouteur d'événement de redimensionnement
    window.addEventListener('resize', handleResize);

    // Nettoyage lors de la destruction
    return () => {
        window.removeEventListener('resize', handleResize);
        simulation.stop();
    };
}