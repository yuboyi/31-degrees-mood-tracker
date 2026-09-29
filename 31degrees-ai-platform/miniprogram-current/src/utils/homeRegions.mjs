export function regionRoute(region) {
  return region === 'uv' || region === 'laser'
    ? `/pages/creative/index?industry=${region}` : null
}

export function templateIndustry(template, types) {
  const parent = types.find(type => type.id === template.template_type_id)
  if (parent?.customization_type === '彩印喷墨') return 'uv'
  if (parent?.customization_type === '光学激光') return 'laser'
  // Do not misclassify an authoritative but unsupported type as UV.
  if (parent) return null
  if (template.product_type === 'inkjet') return 'uv'
  if (template.product_type === 'laser') return 'laser'
  return null
}
