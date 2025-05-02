export function usePersonSelection(emit) {
  const handleSelect = (person) => {
    console.log('Person selected:', person)
    emit('select', person)
  }

  return {
    handleSelect
  }
}
