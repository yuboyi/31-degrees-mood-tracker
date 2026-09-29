export async function loadCreativeCatalog(api) {
  const official = await api.template.officialCatalog()
  if (official?.enabled === true) {
    if (official.source !== 'admin_snapshot' ||
        !Array.isArray(official.template_types) || !Array.isArray(official.templates)) {
      throw new Error('正式模板目录格式不匹配')
    }
    const types = official.template_types.filter(item => item.is_active !== false)
    const ids = new Set(types.map(item => item.id))
    if (types.some(item => typeof item.id !== 'string' || !item.id.startsWith('admin:')) ||
        official.templates.some(item => item.source !== 'admin_snapshot' ||
          typeof item.id !== 'string' || !item.id.startsWith('admin:') ||
          !ids.has(item.template_type_id))) {
      throw new Error('正式模板与类型来源不一致')
    }
    return {
      types,
      templates: official.templates.filter(item => item.is_active !== false),
    }
  }
  if (official?.enabled !== false) throw new Error('模板目录来源未确认')

  const [typeResult, templateResult] = await Promise.all([
    api.templateTypes.list(),
    api.template.list(),
  ])
  if (!Array.isArray(typeResult?.template_types) || !Array.isArray(templateResult?.templates)) {
    throw new Error('模板目录接口返回格式不匹配')
  }
  return {
    types: typeResult.template_types.filter(item => item.is_active !== false),
    templates: templateResult.templates.filter(item => item.is_active !== false),
  }
}
