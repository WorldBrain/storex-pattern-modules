import { valueTemplateNode } from 'user-logic/lib/operations'

export function typedValueTemplate(args) {
    args.definition = args.definition.split(':')[0]
    return valueTemplateNode(args)
}