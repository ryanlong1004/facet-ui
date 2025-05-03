import { watch } from 'vue'

export function useFetchFaces(selectedPersonStore, activeFacesStore) {
    const fetchImages = async (person_id) => {
        try {
            const response = await fetch(`http://0.0.0.0:5000/faces/group/${person_id}`)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            console.log('Data fetched:', data) // Debugging
            activeFacesStore.setActiveFaces(data) // Update the store with fetched faces
        } catch (error) {
            console.error('Error fetching faces:', error)
        }
    }

    watch(
        () => selectedPersonStore.selectedPerson,
        (newPerson, oldPerson) => {
            if (!newPerson) {
                console.log('No person selected')
                activeFacesStore.clearActiveFaces() // Clear faces if no person is selected
                return
            }
            console.log('Selected person changed:', { newPerson, oldPerson })
            fetchImages(newPerson.person_id) // Fetch images for the new person
        },
        { immediate: true }
    )
}
