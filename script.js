function formatText(text) {
    if (!text) return '';
    let formattedText = text.replace(/\\u[\dA-F]{4}/gi, match => String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16)));

    formattedText = formattedText.replace(/([a-z])([A-Z])/g, '$1, $2');

    return formattedText;
}
function isExtinct(info) {
    return JSON.stringify(info).toLowerCase().includes('extinct') || info['Era'];
}

function generateTooltipContent(d) {
    let content = `<strong>${d.data.name}</strong><br><table>`;
    for (let [key, value] of Object.entries(d.data.info)) {
        content += `<tr><td style="padding-right:10px;"><strong>${key}</strong></td><td>${value}</td></tr>`;
    }
    content += `</table>`;
    return content;
}


function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 0.9, // Reduced line height to prevent overlap
            x = text.attr("x"),
            y = text.attr("y"),
            dy = 0, // We reset dy to 0 because we will adjust it based on line number
            tspan = text.text(null)
                .append("tspan")
                .attr("x", x)
                .attr("y", y)
                .attr("dy", dy + "em");

        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                // Recalculate dy based on the number of lines and adjust the tspan's dy
                tspan = text.append("tspan")
                    .attr("x", x)
                    .attr("y", y)
                    .attr("dy", `${++lineNumber * lineHeight + parseFloat(dy)}em`)
                    .text(word);
            }
        }
    });
}


// ... (Other functions remain unchanged)

function createTree(data) {
    const margin = { top: 20, right: 90, bottom: 30, left: 90 },
        width = window.innerWidth - 50,
        height = window.innerHeight - 150;

    // Append the svg object to the body of the page and set up the dimensions
    const svg = d3.select("#tree").append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create a 'g' element for the zoomable area and apply the transform
    const g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Define and apply the zoom behavior to the svg element
    const zoom = d3.zoom()
        .scaleExtent([0.1, 3])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
    svg.call(zoom);

    // Create the tree layout and apply it to the data
    let treeData = d3.hierarchy(data);
    let treeLayout = d3.tree().nodeSize([25, 350]);
    treeLayout(treeData);

    // Create links and nodes
    const link = g.selectAll('.link')
        .data(treeData.links())
        .enter().append('path')
        .attr('class', 'link')
        .attr('d', d3.linkHorizontal()
            .x(function (d) { return d.y; })
            .y(function (d) { return d.x; }));

    const node = g.selectAll('.node')
        .data(treeData.descendants())
        .enter().append('g')
        .attr('class', 'node')
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    // Define the tooltip
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Append circles and text to the nodes
    node.append('circle')
        .attr('r', 7)
        .style('fill', d => isExtinct(d.data.info) ? 'red' : '#69b3a2');
        
    node.append('text')
        .attr("dy", ".35em")
        .attr("x", function (d) { return d.children ? -13 : 13; })
        .style("text-anchor", function (d) { return d.children ? "end" : "start"; })
        .text(function (d) { return formatText(d.data.name); });

    // Add mouseover and mouseout events to the nodes
    node.on('mouseover', function (event, d) {
        let [x, y] = d3.pointer(event, svg.node());

        tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);
        tooltip.html(generateTooltipContent(d))
            .style("left", (x + 20) + "px") // 20px to the right of the cursor
            .style("top", (y) + "px"); // Align with the cursor's y position
    })
        .on('mouseout', function () {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Apply the text wrapping to the node text
    node.selectAll('text').call(wrap, 200);
}

//fetch('Northwest_Semitic_languages_hierarchy.json')
fetch('Semitic_languages_hierarchy.json')
    .then(response => response.json())
    .then(createTree);
