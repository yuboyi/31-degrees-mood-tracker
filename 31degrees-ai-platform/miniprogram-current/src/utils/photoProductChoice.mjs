export function selectablePhotoTypes(result) {
  if (!Array.isArray(result?.template_types)) throw new Error('成品目录格式不匹配')
  return result.template_types
    .filter(item => item.is_active !== false && item.customization_type === '彩印喷墨')
    .map(item => {
      const id = Number(item.id)
      if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error('成品编号尚未对接当前询价接口')
      }
      return { ...item, id }
    })
}

export function keepSelectedPhotoType(types, selectedId) {
  return types.some(item => item.id === selectedId) ? selectedId : null
}
