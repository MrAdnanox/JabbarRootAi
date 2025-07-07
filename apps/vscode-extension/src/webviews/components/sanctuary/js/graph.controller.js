export function initGraph(graph, vscode) {
    const view = document.getElementById('graph-view');
    if (!graph || !graph.nodes || graph.nodes.length === 0) {
        view.innerHTML = `<div class="card"><p>Aucun graphe de connaissance disponible.</p></div>`;
        return;
    }

    // Nettoyer le conteneur
    view.innerHTML = `
        <div class="graph-controls">
            <button id="zoom-in" class="control-button"><i class="fas fa-search-plus"></i></button>
            <button id="zoom-out" class="control-button"><i class="fas fa-search-minus"></i></button>
            <button id="reset-view" class="control-button"><i class="fas fa-sync-alt"></i></button>
        </div>
        <svg id="knowledge-graph"></svg>
    `;

    // Préparer le conteneur SVG
    const width = view.clientWidth;
    const height = Math.max(600, window.innerHeight - 200);
    
    const svg = d3.select('#knowledge-graph')
        .attr('width', '100%')
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height])
        .attr('style', 'max-width: 100%; height: auto; background: #252526;');

    // Définir les marqueurs de flèches
    const defs = svg.append('defs');
    
    // Marqueur de flèche pour les liens
    defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 15)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('xoverflow', 'visible')
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10,0 L 0,5')
        .attr('fill', '#999')
        .style('stroke', 'none');

    // Filtre pour l'effet de surbrillance
    const filter = defs.append('filter')
        .attr('id', 'glow')
        .attr('width', '150%')
        .attr('height', '150%');
    
    filter.append('feGaussianBlur')
        .attr('stdDeviation', '3.5')
        .attr('result', 'coloredBlur');
        
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Créer un groupe pour le zoom
    const g = svg.append('g');

    // Définir la simulation de force
    const simulation = d3.forceSimulation(graph.nodes)
        .force('link', d3.forceLink(graph.edges).id(d => d.id).distance(150))
        .force('charge', d3.forceManyBody().strength(-500))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => (d.size || 1) * 2 + 10));

    // Créer les liens
    const link = g.append('g')
        .selectAll('line')
        .data(graph.edges)
        .join('line')
        .attr('class', 'link')
        .attr('marker-end', 'url(#arrowhead)');

    // Créer les nœuds
    const node = g.append('g')
        .selectAll('.node')
        .data(graph.nodes)
        .join('g')
        .attr('class', 'node')
        .call(drag(simulation));

    // Ajouter des cercles pour les nœuds
    node.append('circle')
        .attr('r', d => Math.sqrt(d.size || 1) * 2 + 10)
        .attr('fill', d => {
            if (d.type === 'class') return '#4f46e5';
            if (d.type === 'function') return '#10b981';
            if (d.type === 'file') return '#f59e0b';
            return '#6b7280';
        })
        .style('cursor', 'pointer')
        .on('mouseover', function() {
            d3.select(this).classed('node-hover', true);
        })
        .on('mouseout', function() {
            d3.select(this).classed('node-hover', false);
        });

    // Ajouter des étiquettes de texte
    const labels = node.append('text')
        .attr('dy', 4)
        .attr('text-anchor', 'middle')
        .text(d => d.label || d.id)
        .attr('fill', 'white')
        .style('font-size', '10px')
        .style('pointer-events', 'none');

    // Gestion du zoom
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    svg.call(zoom);

    // Mise à jour de la position à chaque tick de la simulation
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Gestion du clic sur un nœud
    node.on('dblclick', (event, d) => {
        if (d.path) {
            vscode.postMessage({
                command: 'openFile',
                path: d.path
            });
        }
    });

    // Contrôles de zoom
    d3.select('#zoom-in').on('click', () => {
        svg.transition().call(zoom.scaleBy, 1.3);
    });

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