// Fichier : apps/vscode-extension/src/webviews/components/sanctuary/js/graph.controller.js

export function initGraph(graphData, vscode) {
    const view = document.getElementById('graph-view');
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
        view.innerHTML = `<div class="card"><p>Aucun graphe de connaissance promu n'a été trouvé pour ce projet. Lancez l'analyse 'Ordo Ab Chaos'.</p></div>`;
        return;
    }

    const width = view.clientWidth;
    const height = Math.max(800, window.innerHeight - 150);

    // --- 1. Différenciation Visuelle ---
    const colorScale = d3.scaleOrdinal()
        .domain(['File', 'Symbol-class', 'Symbol-function', 'Symbol-interface', 'Symbol-const', 'Symbol-module', 'Symbol-unknown'])
        .range(['#f59e0b', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#fbbf24', '#9ca3af']);

    const radiusScale = d3.scaleOrdinal()
        .domain(['File', 'Symbol'])
        .range([8, 5]); // Fichiers plus gros que les symboles

    const svg = d3.select('#knowledge-graph')
        .attr('width', '100%')
        .attr('height', height)
        .call(d3.zoom().on("zoom", (event) => g.attr("transform", event.transform)))
        .on("dblclick.zoom", null); // Désactiver le zoom sur double-clic

    const g = svg.append("g");

    // --- 3. Tooltips Contextuels ---
    const tooltip = d3.select("body").append("div")
        .attr("class", "graph-tooltip")
        .style("opacity", 0);

    const simulation = d3.forceSimulation(graphData.nodes)
        .force("link", d3.forceLink(graphData.edges).id(d => d.id).distance(120).strength(0.5))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width / 2).strength(0.05))
        .force("y", d3.forceY(height / 2).strength(0.05));

    const link = g.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(graphData.edges)
        .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value || 1));

    // Créer un groupe pour chaque noeud (cercle + label)
    const nodeGroup = g.append("g")
        .selectAll("g")
        .data(graphData.nodes)
        .join("g")
        .call(drag(simulation));

    nodeGroup.append("circle")
        .attr("r", d => radiusScale(d.type))
        .attr("fill", d => colorScale(d.type === 'Symbol' ? `Symbol-${d.kind}` : d.type))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5);

    // --- 2. Affichage des Labels ---
    nodeGroup.append("text")
        .text(d => d.label)
        .attr("x", 12)
        .attr("y", 4)
        .attr("class", "node-label");

    // --- 3 & 4. Tooltips et Interactivité ---
    nodeGroup
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`<strong>${d.label}</strong><br/>Type: ${d.type}<br/>${d.kind ? `Kind: ${d.kind}<br/>` : ''}Path: ${d.id}`)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
        })
        .on("click", (event, d) => {
            if (d.type === 'File') {
                vscode.postMessage({
                    command: 'openFile',
                    path: d.id
                });
            }
        });

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        
        nodeGroup.attr("transform", d => `translate(${d.x},${d.y})`);
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