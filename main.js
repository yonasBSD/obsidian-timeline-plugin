// Obsidian Timeline Plugin - Pre-built version
// This file is generated - works without TypeScript compilation

const { Plugin, MarkdownRenderChild } = require('obsidian');

// XSS protection - sanitize text
const sanitizeText = (text) => {
    if (!text) return '';
    return text.replace(/[&<>]/g, (m) => {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
};

const renderBodyText = (plainText) => {
    if (!plainText || !plainText.trim()) return '';
    const safe = plainText.replace(/[&<>]/g, (m) => {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
    const paragraphs = safe.split(/\n\s*\n/);
    const processed = paragraphs.map(p => {
        const lines = p.split(/\n/);
        if (lines.length === 1) {
            const trimmed = lines[0].trim();
            if (trimmed) return `<p>${trimmed}</p>`;
            return '';
        }
        const inner = lines.map(l => l.trim()).filter(l => l).join('<br>');
        return inner ? `<p>${inner}</p>` : '';
    }).filter(p => p).join('');
    return processed || '';
};

const parseTimelineSteps = (blockContent) => {
    const lines = blockContent.split(/\r?\n/);
    const steps = [];
    const warnings = [];
    let i = 0;

    const stepPattern = /^\s*(?:(\d+)|([*\-]))\s*\.?\s*\*\*(.*?)\*\*\s+\*(.*?)\*\s*$/i;

    while (i < lines.length) {
        const line = lines[i];
        const match = line.match(stepPattern);

        if (match) {
            const numericIndex = match[1];
            const unorderedMarker = match[2];
            const titleRaw = match[3] || '';
            const subtitleRaw = match[4] || '';

            let indexValue;
            let autoConverted = false;

            if (numericIndex) {
                indexValue = parseInt(numericIndex, 10);
            } else if (unorderedMarker === '*' || unorderedMarker === '-') {
                indexValue = steps.length + 1;
                autoConverted = true;
                warnings.push(`Unordered marker "${unorderedMarker}" → converted to index ${indexValue}`);
            } else {
                indexValue = steps.length + 1;
            }

            const sanitizedTitle = sanitizeText(titleRaw.trim());
            const sanitizedSubtitle = sanitizeText(subtitleRaw.trim());

            let bodyLines = [];
            i++;
            while (i < lines.length) {
                const nextLine = lines[i];
                if (nextLine.match(stepPattern)) {
                    break;
                }
                bodyLines.push(nextLine);
                i++;
            }

            const bodyContent = bodyLines.join('\n').trim();

            steps.push({
                index: indexValue,
                title: sanitizedTitle || 'Untitled',
                subtitle: sanitizedSubtitle || '',
                body: bodyContent
            });

            continue;
        }

        i++;
    }

    return { steps, warnings };
};

const renderTimelineHTML = (steps, warnings) => {
    if (!steps.length) {
        return `<div class="md-timeline-warning">⚠️ No valid timeline steps found. Use: <code>1. **Title** *Subtitle*</code></div>`;
    }

    let html = `<div class="md-timeline-container">`;

    for (let idx = 0; idx < steps.length; idx++) {
        const step = steps[idx];
        const bodyHtml = step.body ? `<div class="md-timeline-body">${renderBodyText(step.body)}</div>` : '';

        html += `
            <div class="md-timeline-step">
                <div class="md-timeline-axis">
                    <div class="md-timeline-badge">${step.index}</div>
                    <div class="md-timeline-connector"></div>
                </div>
                <div class="md-timeline-content">
                    <h3 class="md-timeline-title">${sanitizeText(step.title)}</h3>
                    ${step.subtitle ? `<div class="md-timeline-subtitle">${sanitizeText(step.subtitle)}</div>` : ''}
                    ${bodyHtml}
                </div>
            </div>
        `;
    }

    html += `</div>`;

    if (warnings.length > 0) {
        const warningHtml = `<div class="md-timeline-warning">⚠️ ${warnings.join(' · ')}</div>`;
        return warningHtml + html;
    }

    return html;
};

class TimelinePlugin extends Plugin {
    async onload() {
        console.log('Loading Markdown Timeline plugin');

        // Register a markdown code block processor for "timeline" language
        this.registerMarkdownCodeBlockProcessor("timeline", (source, el, ctx) => {
            console.log("Processing timeline block:", source.substring(0, 50));
            const { steps, warnings } = parseTimelineSteps(source);
            const html = renderTimelineHTML(steps, warnings);
            const container = el.createDiv();
            container.insertAdjacentHTML('beforeend', html);
        });

        // Also process inline ::: timeline blocks (alternative syntax)
        this.registerMarkdownPostProcessor((element, context) => {
            // Look for code blocks with the content starting with ::: timeline
            const codeBlocks = element.querySelectorAll('pre');

            codeBlocks.forEach((pre) => {
                const code = pre.querySelector('code');
                if (!code) return;

                const text = code.textContent || '';

                // Check for timeline fence
                if (text.match(/:::\s*timeline\s*\n/)) {
                    console.log("Found timeline fence block");
                    const timelineMatch = text.match(/:::\s*timeline\s*\n([\s\S]*?)\n:::/);
                    if (timelineMatch) {
                        const timelineContent = timelineMatch[1];
                        const { steps, warnings } = parseTimelineSteps(timelineContent);
                        const html = renderTimelineHTML(steps, warnings);

                        // Replace the pre element with our timeline
                        const wrapper = document.createElement('div');
                        wrapper.className = 'md-timeline-wrapper';
                        wrapper.insertAdjacentHTML('beforeend', html);
                        pre.parentNode?.replaceChild(wrapper, pre);
                    }
                }
            });
        });
    }

    onunload() {
        console.log('Unloading Markdown Timeline plugin');
    }
}

module.exports = TimelinePlugin;
