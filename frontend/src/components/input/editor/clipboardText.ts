import type {Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

const LIST_TYPES = new Set(['bulletList', 'orderedList', 'taskList'])

function nodeLines(node: ProseMirrorNode, indent: string): string[] {
	if (node.isText) {
		return [node.text ?? '']
	}

	if (LIST_TYPES.has(node.type.name)) {
		const lines: string[] = []
		let index = 1
		node.forEach(child => {
			const marker = node.type.name === 'orderedList' ? `${index}. ` : '- '
			const childLines = nodeLines(child, `${indent}  `)
			childLines.forEach((line, position) => {
				lines.push(position === 0 ? `${indent}${marker}${line}` : line)
			})
			index += 1
		})
		return lines
	}

	// Blocks that only wrap other blocks (list items, task items, blockquotes, the
	// document itself) contribute no text of their own, their children do.
	if (node.isBlock && node.childCount > 0 && node.firstChild !== null && node.firstChild.isBlock) {
		const lines: string[] = []
		node.forEach(child => {
			lines.push(...nodeLines(child, indent))
		})
		return lines
	}

	return [node.textContent]
}

/**
 * Plain text for the clipboard. ProseMirror's default serializer only concatenates
 * the text nodes, which drops the list markers and turns a copied list into
 * unstructured lines when pasted anywhere else.
 */
export function clipboardTextFromSlice(slice: Slice): string {
	const lines: string[] = []
	slice.content.forEach(child => {
		lines.push(...nodeLines(child, ''))
	})
	return lines.join('\n')
}
