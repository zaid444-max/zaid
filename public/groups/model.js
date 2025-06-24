const addBrandButt = document.querySelector('.add-item-div2');
const tableTbody = document.querySelector('.table-tbody');
const brandList = [];
const searchInp = document.querySelector('.search-inp2');
const tableDiv = document.querySelector('.table-div');
const cleanInpIcon = document.querySelector('.fa-times-circle');

addBrandButt.addEventListener('click', async () => {
  await fetch(`https://${serverIP}/model`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      model: 'Model'
    })
  })
  await fetchBrands();
})

async function fetchBrands() {
  const scrollPosition = tableDiv.scrollTop;
  tableTbody.innerHTML = '';
  const response = await fetch(`https://${serverIP}/model?limit=${100}&search=${searchInp.value.trim()}`);
  const brands = await response.json();
  brands.sort((a, b) => b.id - a.id)
  for(const [index, brand] of brands.entries()) {
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
    <td class="index-td">${index + 1}</td>
    <td class="brand-id-td" style="display: none;">${brand.id} </td>
    <td class="brand-name-td" onclick="editBrand(event)"><span class="brand-name-span">${brand.name}</span><i class="fas fa-trash delete-icon" onclick="deleteBrand(event)"></i></td>
    `
    tableTbody.appendChild(newRow);
    brandList.push(newRow);
  }
  tableDiv.scrollTop = scrollPosition;
}

fetchBrands();

async function deleteBrand(event) {
  const name = event.target.closest('.brand-name-td').querySelector('.brand-name-span').innerHTML;
  const id = parseInt(event.target.closest('tr').querySelector('.brand-id-td').innerHTML);
  const response = await fetch(`https://${serverIP}/items`);
  const items = await response.json();
  if(items.some(item => item.model_name === name) || id === 0) {
    if (items.some(item => item.model_name === name))
      Toastify({
        text: `You can't delete this model, because it's used.`,
        duration: 2000,
        gravity: 'top', // or 'top'
        position: 'center', // or 'right', 'center'
        style: {
          background: 'rgb(154, 59, 59)',
          borderRadius: '10px',
        },
        stopOnFocus: true,
      }).showToast();
    else if (id === 0)
      Toastify({
        text: `You can't delete this model, because it's a default model.`,
        duration: 2000,
        gravity: 'top', // or 'top'
        position: 'center', // or 'right', 'center'
        style: {
        background: 'rgb(154, 59, 59)',
        borderRadius: '10px',
        },
        stopOnFocus: true,
      }).showToast();
    return;
  };
  await fetch(`https://${serverIP}/model/${id}`, {method: 'DELETE'});
  Toastify({
    text: `Successfully deleted!`,
    duration: 2000,
    gravity: 'top', // or 'top'
    position: 'center', // or 'right', 'center'
    style: {
      background: 'rgb(59, 154, 130)',
      borderRadius: '10px',
    },
    stopOnFocus: true,
  }).showToast();
  await fetchBrands();
}

function editBrand(event) {
  if (event.target.classList.contains('delete-icon')) {return}
  if (event.target.closest('tr').querySelector('span').querySelector('input')) {return};
  const newInp = document.createElement('input');
  newInp.className = 'newInp';
  const brandSpan = event.target.closest('tr').querySelector('span');
  const oldValue = brandSpan.innerHTML;
  brandSpan.innerHTML ='';
  newInp.value = oldValue;
  brandSpan.appendChild(newInp);
  newInp.focus();
  newInp.select();

  newInp.addEventListener('blur', async () => {
    const id = event.target.closest('tr').querySelector('.brand-id-td').innerHTML;
    const response = await fetch(`https://${serverIP}/model`);
    const brands = await response.json();
    for (const brand of brands) {
      if (brand.id === Number(id)) continue
      if (brand.name.toLowerCase() === newInp.value.trim().toLowerCase()) {
        brandSpan.innerHTML = oldValue;
        Toastify({
          text: `Not updated because it already exists!`,
          duration: 4000,
          gravity: 'top', // or 'top'
          position: 'center', // or 'right', 'center'
          style: {
            background: 'rgb(154, 62, 59)',
            borderRadius: '10px',
          },
          stopOnFocus: true,
        }).showToast();
        return;
      }
    }
    brandSpan.innerHTML = newInp.value.trim() || oldValue;
    if (oldValue !== newInp.value.trim()) {
      const id = event.target.closest('tr').querySelector('.brand-id-td').innerHTML;
    await fetch(`https://${serverIP}/model/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        name: newInp.value.trim()
      })
    })
    Toastify({
      text: `Successfully updated!`,
      duration: 1500,
      gravity: 'top', // or 'top'
      position: 'center', // or 'right', 'center'
      style: {
        background: 'rgb(59, 154, 119)',
        borderRadius: '10px',
      },
      stopOnFocus: true,
    }).showToast();
    }
  })

  newInp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {newInp.blur();}
  })
}

document.querySelector('h2').addEventListener('click', (e) => {
  if (e.target.classList.contains('brand-span2')) {
    document.body.classList.add('animate-out');
    setTimeout(() => {
      window.location.href = 'brand.html';
    }, 200)
  }
  else if (e.target.classList.contains('model-span2')) {
    document.body.classList.add('animate-out');
    setTimeout(() => {
      window.location.href = 'model.html';
    }, 200)
  }
  else if (e.target.classList.contains('category-span2')) {
    document.body.classList.add('animate-out');
    setTimeout(() => {
      window.location.href = 'category.html';
    }, 200)
  }
  else if (e.target.classList.contains('quality-span2')) {
    document.body.classList.add('animate-out');
    setTimeout(() => {
      window.location.href = 'quality.html';
    }, 200)
  }
})

searchInp.focus();

searchInp.addEventListener('input', function() {
  fetchBrands();
  cleanInpIcon.style.display = searchInp.value !== '' ? 'block' : 'none';
})

cleanInpIcon.addEventListener('click', function() {
  this.style.display = 'none';
  searchInp.value = '';
  fetchBrands();
})