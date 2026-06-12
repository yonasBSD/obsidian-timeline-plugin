import { App, Plugin, MarkdownPostProcessorContext } from 'obsidian';

// XSS protection - sanitize text
const sanitizeText = (text: string): string => {
    if (!text) return '';
    return text.replace(/[&<>]/g, (m) => {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
};

const renderBodyText = (plainText: string): string => {
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

interface TimelineStep {
    index: number;
    title: string;
    subtitle: string;
    body: string;
}

const parseTimelineSteps = (blockContent: string): { steps: TimelineStep[]; warnings: string[] } => {
    const lines = blockContent.split(/\r?\n/);
    const steps: TimelineStep[] = [];
    const warnings: string[] = [];
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

            let indexValue: number;
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

            let bodyLines: string[] = [];
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

const renderTimelineHTML = (steps: TimelineStep[], warnings: string[]): string => {
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

export default class TimelinePlugin extends Plugin {
    async onload() {
        console.log('Loading Markdown Timeline plugin');

        this.registerMarkdownPostProcessor((element: HTMLElement, context: MarkdownPostProcessorContext) => {
            const timelineBlocks = element.querySelectorAll('pre');

            timelineBlocks.forEach((pre) => {
                const code = pre.querySelector('code');
                if (!code) return;

                const text = code.textContent || '';
                if (text.trim().startsWith('::: timeline') || text.includes(':::timeline')) {
                    const timelineMatch = text.match(/:::\s*timeline\s*\n([\s\S]*?)\n:::/);
                    if (timelineMatch) {
                        const timelineContent = timelineMatch[1];
                        const { steps, warnings } = parseTimelineSteps(timelineContent);
                        const html = renderTimelineHTML(steps, warnings);

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
