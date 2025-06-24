const tableTBody = document.querySelector('.table').getElementsByTagName('tbody')[1];
const addItemButt = document.querySelector('.add-item-butt');
const searchInp = document.querySelector('.search-inp');
searchInp.focus();
const initialTableTbodyArrey = [];
const stockInvsArray = [];
const inpValResetterIcon = document.querySelector('.fa-times-circle');
const tableContainer = document.querySelector('.table-div'); // Find the scrollable container
const pageInp = document.querySelector('.page-inp');
const disablingIcon = document.querySelector('.disabling-icon');
const excelPrintIcon = document.querySelector('.print-container-div');
const zeroIcon = document.querySelector('.zero');
let isPendingDone = false;

// Fetch and display items from MySQL
pageInp.value = 50;
let latestFetchId = 0;
async function fetchItems() {
  const thisFetchId = ++latestFetchId; // Increment global fetch ID
  await addPendingStockQnt();
  const searchValue = searchInp.value.trim().toLocaleLowerCase();
  const brandDivVal = document.querySelector(`.brand-div`).innerHTML.trim();
  const categoryDivVal = document.querySelector(`.category-div`).innerHTML.trim().replace(/\+/g, 'plus');
  const scrollPosition = tableContainer.scrollTop; // Store scroll position
  initialTableTbodyArrey.length = 0;
  tableTBody.innerHTML = '';
  const limit = pageInp.value === '' ? 50 : Number(pageInp.value.trim());
  const url = `http://${serverIP}:${port}/itemsFilter?limit=${limit}&search=${searchValue}&brandDivVal=${brandDivVal}&categoryDivVal=${categoryDivVal}`
  try {
    const response = await fetch(url);
    const items = await response.json();
    if (thisFetchId !== latestFetchId) return;
    items.forEach((item, index) => {
      let totalPendQnt = 0;
      const id = item.id;
      const mappedArrey = stockInvsArray.map(stockInv => {
        return stockInv.items.filter(item => item.itemId === id)[0]
      }).filter(item => item !== undefined)
      mappedArrey.forEach(item => {
        totalPendQnt += item.quantity
      })
      const newRow = document.createElement('tr');
      newRow.setAttribute("data-id", item.id); // Add this line
      newRow.setAttribute('draggable', 'true'); // Make row draggable
      newRow.addEventListener("dragstart", handleDragStart);
      newRow.addEventListener("dragover", handleDragOver);
      newRow.addEventListener("drop", handleDrop);
      newRow.classList.add('draggable-row'); // Add a class for styling;
      newRow.innerHTML = `
      <td class="order-num-td">${index + 1}</td>
      <td class="disable-td"><label class="custom-checkbox"><input class="disable-checkbox-inp" type="checkbox" ${item.disable === 'checked' ? 'checked': ''} onchange="checkBox(event, 'disable')"><span class="checkmark"></span></label></td>
      <td class="noExcel-td"><label class="custom-checkbox"><input class="no-excel-checkbox-inp" type="checkbox" ${item.noExcel === 'checked' ? 'checked': ''} onchange="checkBox(event, 'noExcel')"><span class="checkmark noExcel-checkmar"></span></label></td>
      <td class="id-td">${item.id}</td>
        <td class="dis-or-td">${item.display_order}</td>
        <td class="changing-id-td">${item.changingId === null ? '0':item.changingId}</td>
        <td class="sku-td" onclick="editSKU(event, 'SKU')">${item.SKU === null ? '': item.SKU}</td>
        <td class="box-id-td" onclick="editSKU(event, 'boxId')">${item.boxId === null ? '': item.boxId}</td>
        <td class="brand-td">${item.brand_name}</td>
        <td class="model-td">${item.model_name}</td>
        <td class="category-td">${item.category_name}</td>
        <td class="quality-td">${item.quality_name}</td>
        <td class="quantity-td">${item.quantity}${totalPendQnt !== 0 ? (' + ' + totalPendQnt) : ''}</td>
        <td class="buyPrice-td">${Number(item.buyPrice)}</td>
        <td class="priceOne-td">${Number(item.priceOne)}</td>
        <td class="edit-td" onclick="addDiscription(event)"><i class="fas fa-edit edit-icon"></i></td>
        <td class="delete-td"><i class="fas fa-trash delete-icon"></i></td>
        <td class="discription-td" style="display: none;">${item.discription}</td>
      `;
      initialTableTbodyArrey.push(newRow);
    });
    applyCombinedFilters();
    tableContainer.scrollTop = scrollPosition;
  } catch (error) {
    console.error('Error fetching items:', error);
    }
}
fetchItems();

async function applyCombinedFilters() {
  const hiddingIcon = document.querySelector('.hidding-icon');
  const disablingIcon = document.querySelector('.disabling-icon');
  const excelPrintIcon = document.querySelector('.print-container-div')
  const zeroIcon = document.querySelector('.zero');

  const filteredRows = initialTableTbodyArrey.filter(tr => {
    const disablingMatch = disablingIcon.classList.contains('fa-toggle-on') || !tr.querySelector('.disable-checkbox-inp').checked;
    const excelMatch = excelPrintIcon.classList.contains('active') || !tr.querySelector('.no-excel-checkbox-inp').checked;
    const zeroMatch = zeroIcon.style.backgroundColor === '' || tr.querySelector('.buyPrice-td').innerHTML === '0' || tr.querySelector('.priceOne-td').innerHTML === '0';
    
    return disablingMatch && excelMatch && zeroMatch;
  })

  const buyPriceTh = document.querySelector('.buyPrice-th');
  tableTBody.innerHTML = '';
  async function appendToDOM() {
    filteredRows.forEach((tr, index) => {
      tableTBody.appendChild(tr); tr.querySelector('.order-num-td').innerHTML = index + 1;
      if (hiddingIcon.classList.contains('fa-eye-slash')) {buyPriceTh.style.display = 'none';tr.querySelector('.buyPrice-td').style.display = 'none'}
      else if (hiddingIcon.classList.contains('fa-eye')) {buyPriceTh.style.display = '';tr.querySelector('.buyPrice-td').style.display = ''}
    });
  }
  await appendToDOM();
  updateTotal();
}

async function addPendingStockQnt() {
  if (isPendingDone) return;
  const response = await fetch(`http://${serverIP}:${port}/stockentinvs`);
  const stockInvs = await response.json();
  stockInvs.forEach(invoice => {
    if (invoice.invStatus !== 'Pending') return;
    stockInvsArray.push(invoice);
  })
  fetchBrands('brand', 'brand', '')
  fetchBrands('category', 'category', '-category')
  isPendingDone = true;
}

searchInp.addEventListener('input', async () => {
  await fetchItems();
  inpValResetterIcon.style.display = 'block';
  if (searchInp.value === '') inpValResetterIcon.style.display = 'none';
});

pageInp.addEventListener('keydown', async function(e) {
  if (e.key === 'Enter') await fetchItems();
})

addItemButt.setAttribute('draggable', 'true');
addItemButt.addEventListener('dragstart', (e) => {
  e.dataTransfer.setData('itemId', 'addItemButt')
})

// Add a new item by dragging
tableTBody.addEventListener('drop', async (e) => {
  e.preventDefault();
  if (!disablingIcon.classList.contains('fa-toggle-on') || !excelPrintIcon.classList.contains('active') || zeroIcon.style.backgroundColor !== '') return
  const draggedItem = e.dataTransfer.getData('itemId');
  const tartgetRowOrder = e.target.closest('tr').querySelector('.dis-or-td').innerHTML;
  const targetId = e.target.closest('tr').getAttribute('data-id');
  const response = await fetch(`http://${serverIP}:${port}/items/${targetId}`);
  const item = await response.json();
  if (draggedItem === 'addItemButt') {
    const newItem = {
      brand: item.brand_id,
      model: 0,
      category: item.category_id,
      quality: item.quality_id,
      quantity: 0,
      pendingQnt: 0,
      buyPrice: 0,
      priceOne: 0,
      display_order: tartgetRowOrder - 1
    };
    await fetch(`http://${serverIP}:${port}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    });
    fetchItems(); // Refresh the table after adding
  }
});

// Add a new item by clicking
addItemButt.addEventListener('click', async (e) => {
    const newItem = {
        brand: 0,
        model: 0,
        category: 0,
        quality: 0,
        quantity: 0,
        pendingQnt: 0,
        buyPrice: 0,
        priceOne: 0,
        display_order: 1000000000
    };
  
    try {
        const response = await fetch(`http://${serverIP}:${port}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItem)
        });
        fetchItems(); // Refresh the table after adding
    } catch (error) {
        console.error('Error adding item:', error);
    }
});

// checkbox
async function checkBox(event, updatedField) {
  const idTdHTML = event.target.closest('tr').querySelector('.id-td').innerHTML;
  const response = await fetch(`http://${serverIP}:${port}/items/${idTdHTML}`);
  const item = await response.json();
  await fetch(`http://${serverIP}:${port}/items/${idTdHTML}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      [updatedField]: item[updatedField] === 'checked' ? 'No': 'checked' // Update only the specific field (brand, model, etc.)
    })
  });
}

let draggedRow = null;
let orderNum;

function handleDragStart(event) {
  draggedRow = event.target;
  orderNum = Number(event.target.closest('tr').querySelector('.order-num-td').innerHTML);
  event.dataTransfer.effectAllowed = "move";
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function handleDrop(event) {
  event.preventDefault();
  if (!disablingIcon.classList.contains('fa-toggle-on') || !excelPrintIcon.classList.contains('active') || zeroIcon.style.backgroundColor !== '')
    return Toastify({
      text: `You must active disable and not printed items before you order them`,
      duration: 2500,
      gravity: 'top', // or 'top'
      position: 'center', // or 'right', 'center'
      style: {
        background: 'rgb(154, 59, 59)',
        borderRadius: '10px',
      },
      stopOnFocus: true,
  }).showToast();

  if (draggedRow && draggedRow !== event.target.closest("tr")) {
      const targetRow = event.target.closest("tr");
      const orderNum2 = Number(targetRow.querySelector('.order-num-td').innerHTML);
      // Dragging dwon
      if (orderNum < orderNum2) {
        tableTBody.insertBefore(draggedRow, targetRow.nextSibling);
      }
      // Dragging up
      else {
        tableTBody.insertBefore(draggedRow, targetRow);
      }
      saveNewOrder(); // Save order after drop
  }
  draggedRow = null;
  Array.from(tableTBody.children).forEach((tr, index) => {
    tr.querySelector('.order-num-td').innerHTML = index + 1
  })
}

function updateVisibleOrder(visibleItemIds, allItemOrder) {
  const visibleSet = new Set(visibleItemIds);

  // Filter out the visible items from the overall order
  const remainingItems = allItemOrder.filter(id => !visibleSet.has(id));

  // Find the position of the first visible item in the original order
  const insertIndex = allItemOrder.findIndex(id => visibleSet.has(id));
  if (insertIndex === -1) return; // visible items not found in original list

  // Rebuild the order
  allItemOrder.length = 0;
  allItemOrder.push(
    ...remainingItems.slice(0, insertIndex),
    ...visibleItemIds,
    ...remainingItems.slice(insertIndex)
  );
}

async function saveNewOrder() {
  const response = await fetch(`http://${serverIP}:${port}/items`);
  const items = await response.json();
  let allItemOrder = items.map(item => item.id);
  let visibleItemIds = Array.from(tableTBody.children).map(row => Number(row.getAttribute("data-id")));
  updateVisibleOrder(visibleItemIds, allItemOrder);
  if (visibleItemIds.length === 0) return
  if (!disablingIcon.classList.contains('fa-toggle-on') || !excelPrintIcon.classList.contains('active') || zeroIcon.style.backgroundColor !== '')
    return Toastify({
      text: `You must active disable and not printed items before you order them`,
      duration: 2500,
      gravity: 'top', // or 'top'
      position: 'center', // or 'right', 'center'
      style: {
        background: 'rgb(154, 59, 59)',
        borderRadius: '10px',
      },
      stopOnFocus: true,
  }).showToast();

  fetch(`http://${serverIP}:${port}/update-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedItems: allItemOrder })
  })
  .then(response => response.json())
}

// Upadate an item sku and box Id
async function editSKU(event, updatedField) {
  if (event.target.querySelector('input')) return
  const newInp = document.createElement('input');
  newInp.className = 'sku-inp';
  const oldVal = event.target.innerHTML;
  event.target.innerHTML = '';
  event.target.appendChild(newInp);
  newInp.value = oldVal;
  newInp.focus();
  newInp.select();
  const td = event.target;

  newInp.addEventListener('blur', async () => {
    td.innerHTML = newInp.value.trim() === '' ? oldVal: newInp.value.trim();
    if (newInp.value.trim() === '' || newInp.value.trim() === oldVal) return;

    const idTdHTML = event.target.closest('tr').querySelector('.id-td').innerHTML;
    await fetch(`http://${serverIP}:${port}/items/${idTdHTML}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        [updatedField]: newInp.value.trim() // Update only the specific field (brand, model, etc.)
      })
    });
  })

  newInp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      newInp.blur();
    }
  })
}

tableTBody.addEventListener('click', (e) => {
  if (e.target.closest('.brand-td')) {addEventListenerTo('brand', e);} 
  else if (e.target.closest('.model-td')) {addEventListenerTo('model', e);}
  else if (e.target.closest('.category-td')) {addEventListenerTo('category', e);}
  else if (e.target.closest('.quality-td')) {addEventListenerTo('quality', e);}
  //else if (e.target.closest('.buyPrice-td')) {addEventListenerTo('buyPrice', e, 'number', (event) => event.key !== '-');}
  //else if (e.target.closest('.priceOne-td')) {addEventListenerTo('priceOne', e, 'number', (event) => event.key !== '-');}
})

// Upadate an item
async function addEventListenerTo(brand, e, inputType, notInclude) {
   if (e.target.style.color === 'green') return;
  const Td = e.target.closest(`.${brand}-td`);
  const customDropdwonContainer = document.createElement('div');
  customDropdwonContainer.className = 'input-container-div';
  document.body.appendChild(customDropdwonContainer)
  const newInp = document.createElement('input');
  newInp.className = 'new-inp';
  newInp.spellcheck = false;
  newInp.placeholder = { brand: 'Brand', model: 'Model', category: 'Category', quality: 'Quality' }[brand] || '';
  const customDropdwon = document.createElement('div');
  customDropdwon.className = 'costum-dropdwon';

  customDropdwonContainer.appendChild(newInp)
  customDropdwonContainer.appendChild(customDropdwon)

  const idTdHTML = parseInt(e.target.closest('tr').querySelector('.id-td').innerHTML);
  if (e.target.closest(`.${brand}-td`)) {
    Td.style.color = 'green';
    customDropdwonContainer.style.display = 'flex';
    customDropdwonContainer.style.position = 'absolute';
    customDropdwonContainer.style.width = `${Td.offsetWidth + 0.2}px`
    newInp.style.width = `${Td.offsetWidth - 20}px`

    // Function to update dropdown position dynamically
    function updateDropdownPosition() {
      if (!Td) return; // Prevent errors if Td is not defined
      const rect = Td.getBoundingClientRect(); // Get new position relative to viewport
      customDropdwonContainer.style.left = `${rect.left + window.scrollX + 3}px`;
      customDropdwonContainer.style.top = `${rect.top + window.scrollY + 40}px`;
      newInp.style.top = `${rect.top + window.scrollY + 48}px`
    }

    // Update dropdown position initially
    updateDropdownPosition();

    // Listen for scrolling and update position dynamically
    window.addEventListener("scroll", updateDropdownPosition);
    
      const response = await fetch(`http://${serverIP}:${port}/${brand}`);
      const brands = await response.json();
      for(const brand2 of brands) {
        const span = document.createElement('span');
        span.className = `${brand}-span`
        if (brand2.name === 'Brand' || brand2.name === 'Model' || brand2.name === 'Category' || brand2.name === 'Quality') continue;
        span.innerHTML = brand2.name
        customDropdwon.appendChild(span);
    }
    const brandArray = Array.from(customDropdwon.children).map(span => span.innerHTML);
    let index = -1;
    newInp.addEventListener('input', async () => {
      index = -1;
      customDropdwon.innerHTML = '';
      const updatedInpVal = newInp.value;
      if (brand !== 'model') {
        const lastArray = brandArray.filter(brand => brand.toLocaleLowerCase().includes(updatedInpVal.toLocaleLowerCase()));
        lastArray.forEach(brand => {
          const span = document.createElement('span');
          span.className = `brand-span`
          span.innerHTML = brand;
          customDropdwon.appendChild(span);
        });
      } else if (brand === 'model') {
        const response = await fetch(`http://${serverIP}:${port}/model?search=${updatedInpVal.toLocaleLowerCase()}&limit=${100}`);
        const models = await response.json();
        const lastArray = models.filter(brand => brand.name.toLocaleLowerCase().includes(updatedInpVal.toLocaleLowerCase()));
        lastArray.forEach(brand => {
          const span = document.createElement('span');
          span.className = `brand-span`
          span.innerHTML = brand.name;
          customDropdwon.appendChild(span);
        });
      }
    })
    newInp.addEventListener('keydown', (e) => {
      const brandArray2 = Array.from(customDropdwon.children);
      if (!brandArray2.length) return; // Exit if no items
    
      // Remove previous highlight
      if (index >= 0) brandArray2[index].style.backgroundColor = '';
    
      if (e.key === 'ArrowDown') {
        index = Math.min(index + 1, brandArray2.length - 1); // Ensure it doesn't go beyond the last item
      } else if (e.key === 'ArrowUp') {
        index = Math.max(index - 1, -1); // Ensure it doesn't go below -1
      } else if (e.key === 'Enter') {
        newInp.value = Array.from(customDropdwon.children)[index].innerHTML;
        editItem(e, newInp, brand, Td, idTdHTML, customDropdwonContainer);
      }
      // Apply new highlight
      if (index >= 0) {
        brandArray2[index].style.backgroundColor = 'grey';

        // Check if the selected option is out of view and scroll to it
        const option = brandArray2[index];
        const dropdown = customDropdwon; // Dropdown container
        
        // Check if the selected option is out of the visible area
        if (option.offsetTop + option.offsetHeight > dropdown.scrollTop + dropdown.clientHeight) {
          dropdown.scrollTop = option.offsetTop + option.offsetHeight - dropdown.clientHeight; // Scroll down
        } else if (option.offsetTop < dropdown.scrollTop) {
          dropdown.scrollTop = option.offsetTop; // Scroll up
        }
      }
    });
    newInp.type = `${inputType}`;
    newInp.keydown = `${notInclude}` 
    newInp.focus();

    customDropdwon.addEventListener('click', async (e) => {
      newInp.value = e.target.innerHTML.trim();
      editItem(e, newInp, brand, Td, idTdHTML, customDropdwonContainer);
    })

    let tdColor = 'green';
    document.addEventListener('click', (event) => {
      if ((!event.target.closest('costum-dropdwon') && !event.target.closest('.new-inp')))  {
        customDropdwonContainer.remove();
      }
      if (tdColor === 'green' && !event.target.closest('.new-inp')) {
        Td.style.color = '';
        tdColor = 'notGreen'
      }
    })

    newInp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        newInp.blur();
      }
    });

    // Prevent entering invalid characters (optional)
    if (notInclude) {
      newInp.addEventListener('keydown', (event) => {
        if (!notInclude(event)) {
          event.preventDefault();
        }
      });
    }
  }
}

async function editItem(e, newInp, brand, Td, idTdHTML, customDropdwonContainer) {
  let NewInpId = newInp.value.trim();
  Td.style.color = '';
  const response = await fetch(`http://${serverIP}:${port}/${brand}${brand === 'model' ? `?limit=${200000}` : ''}`);
  const brands = await response.json();
  const targetBrand = brands.find(brand => brand.name === NewInpId);
  NewInpId = targetBrand.id;
  customDropdwonContainer.style.display = 'none';
  Td.innerHTML = newInp.value.trim();

  // Send the updated data to the backend
  try {
    await fetch(`http://${serverIP}:${port}/items/${idTdHTML}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
    },
      body: JSON.stringify({
        [brand]: NewInpId // Update only the specific field (brand, model, etc.)
      })
    });

  } catch (error) {
    console.error('Error updating item:', error);
  }
  Td.style.color = '';
}

tableTBody.addEventListener('click', (e) => {
  editPrice(e, 'buyPrice', 'buyPrice');
  editPrice(e, 'priceOne','priceOne');
  editPrice(e, 'changing-id', 'changingId')
})

// Update an item price
async function editPrice(e, price, updatedField) {
  if (document.querySelector('.price-inp')) return
  if (e.target.closest(`.${price}-td`)) {
    const td = e.target.closest(`.${price}-td`);
    const priceInp = document.createElement('input');
    priceInp.className = 'price-inp';
    priceInp.type = 'number';
    priceInp.value = td.innerHTML;
    priceInp.select();
    priceInp.addEventListener("keydown", (event) => {
      if (['-', 'ArrowUp', 'ArrowDown', 'e', 'E'].includes(event.key)) {
        event.preventDefault(); // Prevent the '-' character from being typed
      }
      if (event.key === 'Enter') {priceInp.blur()};
    });
    const oldValue = td.innerHTML;
    td.innerHTML = '';
    td.appendChild(priceInp)
    priceInp.focus();
    const idTdHTML = parseInt(e.target.closest('tr').querySelector('.id-td').innerHTML);
    priceInp.addEventListener('blur', async () => {
      td.innerHTML = priceInp.value.trim() === '' ? oldValue: updatedField === 'changingId' ? priceInp.value.trim(): updatedField === 'changingId' && priceInp.value.trim() === '0' ? oldValue: parseFloat(priceInp.value.trim());
      await fetch(`http://${serverIP}:${port}/items/${idTdHTML}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [updatedField]: priceInp.value.trim() === '' ? oldValue: updatedField === 'changingId' && priceInp.value.trim() === '0' ? null: priceInp.value.trim()
        })
      });
      priceInp.remove();

      if (updatedField === 'changingId') {
        const response = await fetch(`http://${serverIP}:${port}/items`);
        const items = await response.json();
        for(const item of items) {
          if (item.changingId === Number(priceInp.value.trim())) {
            if (item.id === idTdHTML) continue
            e.target.closest('tr').querySelector(`.priceOne-td`).innerHTML = Number(item.priceOne);
            await fetch(`http://${serverIP}:${port}/items/${idTdHTML}`, {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                priceOne: item.priceOne
              })
            })
            return
          }
        }
      } else if (updatedField === 'priceOne') {
        const response = await fetch(`http://${serverIP}:${port}/items`);
        const items = await response.json();
        const itemChanging = e.target.closest('tr').querySelector('.changing-id-td').innerHTML;
        for(const item of items) {
          if (item.changingId === Number(itemChanging)) {
            await fetch(`http://${serverIP}:${port}/items/${item.id}`, {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                [updatedField]: priceInp.value.trim() === '' ? oldValue: priceInp.value.trim()
              })
            })
          }
        }
        Array.from(tableTBody.children).forEach(tr => {
          if (itemChanging === tr.querySelector('.changing-id-td').innerHTML) {
            if (itemChanging === '0') return
            tr.querySelector(`.${price}-td`).innerHTML = priceInp.value.trim() === '' ? oldValue: priceInp.value.trim();
          }
        })
      }
      updateTotal();
    })
  }
}

// Delete an item
tableTBody.addEventListener('click', async (e) => {
  if (e.target.classList.contains('delete-icon')) {
    const itemId = e.target.closest('tr').querySelector('.id-td').innerHTML;
    const response = await fetch(`http://${serverIP}:${port}/stockentinvs`);
    const stockInvs = await response.json();
    for (const invoice of stockInvs) {
      for(const item of invoice.items)
        if (item.itemId === Number(itemId)) {
          // Show a toast notification
          Toastify({
            text: `You can't delete this item, because it's used`,
            duration: 4000,
            gravity: 'top', // or 'top'
            position: 'center', // or 'right', 'center'
            style: {
              background: 'rgb(154, 59, 59)',
              borderRadius: '10px',
            },
            stopOnFocus: true,
          }).showToast();
          return;
        }
    }
    await fetch(`http://${serverIP}:${port}/items/${itemId}`, { method: 'DELETE' });
    Toastify({
      text: `Successfully deleted!`,
      duration: 1500,
      gravity: 'top', // or 'top'
      position: 'center', // or 'right', 'center'
      style: {
      background: 'rgb(59, 154, 109)',
      borderRadius: '10px',
      },
      stopOnFocus: true,
    }).showToast();
    fetchItems()
  }
});

// (select brand..) filter
const customDropdwonContainer = document.querySelector('.brand-input-container-div');
const categoryCustomDropdwonContainer = document.querySelector('.category-input-container-div');
const brandDiv = document.querySelector('.brand-div');
const brandNewInp = document.querySelector('.brand-new-inp');
const categoryNewInp = document.querySelector('.category-new-inp');
document.body.addEventListener('click', (e) => {
  const customDropdwon = customDropdwonContainer.querySelector('.brand-costum-dropdwon');
  if (e.target.classList.contains('brand-div') || e.target.classList.contains('brand-new-inp')) {
    index = -1;
    customDropdwonContainer.style.display = '';
    brandNewInp.focus();
    customDropdwon.scrollTop = 0;
  } else {
    customDropdwonContainer.style.display = 'none';
    brandNewInp.value = '';
  }
  const categoryCustomDropdwon = categoryCustomDropdwonContainer.querySelector('.category-costum-dropdwon');
  if (e.target.classList.contains('category-div') || e.target.classList.contains('category-new-inp')) {
    index = -1;
    categoryCustomDropdwonContainer.style.display = '';
    categoryNewInp.focus();
    categoryCustomDropdwon.scrollTop = 0;
  } else {
    categoryCustomDropdwonContainer.style.display = 'none';
    categoryNewInp.value = '';
  }
})

// fetching brands to filter
async function fetchBrands(brand, className, arrowIcon) {
  const customDropdwonContainer = document.querySelector(`.${brand}-input-container-div`);
  const brandDiv = document.querySelector(`.${brand}-div`);
  const input = document.querySelector(`.${brand}-new-inp`);

  const brandDivArrowIcon = document.querySelector(`.fa-caret-down${arrowIcon}`);
  const customDropdwon = document.createElement('div');
  customDropdwon.className = `${brand}-costum-dropdwon`;
  customDropdwonContainer.appendChild(customDropdwon)

  const response = await fetch(`http://${serverIP}:${port}/${brand}`);
  const brands = await response.json();
  brands.forEach(brand => {
    if (brand.name === 'Brand' || brand.name === 'Category') return
    const span = document.createElement('span');
    span.className = `${className}-list-span`;
    span.innerHTML = brand.name;
    span.setAttribute('data-id', brand.id);
    customDropdwon.appendChild(span);
    
    span.addEventListener('click', (e) => {
      clickSpan(brandDiv, e.target, brandDivArrowIcon, className === 'brand' ? '': className === 'category' ? 'fa-times-category':'');
    })
  })

  const initialArray = Array.from(customDropdwon.children);
  let index = -1;
  // search for the (select brand..) filter
  input.addEventListener('input', () => {
    const brandArray2 = Array.from(customDropdwon.children);
    brandArray2.forEach(span => {if (brandArray2[index]) {brandArray2[index].style.backgroundColor = '';}}
    )
    index = -1;
    customDropdwon.innerHTML = '';
    const updatedVal = input.value;
    const filteredArrey = initialArray.filter(span => span.innerHTML.toLocaleLowerCase().includes(updatedVal.toLocaleLowerCase()));
    filteredArrey.forEach(span => customDropdwon.appendChild(span))
  })

  // Heilight arrow
  input.addEventListener('keydown', (e) => {
    const brandArray2 = Array.from(customDropdwon.children);
    if (!brandArray2.length) return; // Exit if no items
  
    // Remove previous highlight
    if (index >= 0) brandArray2[index].style.backgroundColor = '';
  
    if (e.key === 'ArrowDown') {
      index = Math.min(index + 1, brandArray2.length - 1); // Ensure it doesn't go beyond the last item
    } else if (e.key === 'ArrowUp') {
      index = Math.max(index - 1, -1); // Ensure it doesn't go below -1
    } else if (e.key === 'Enter') {
      clickSpan(brandDiv, brandArray2[index], brandDivArrowIcon,  className === 'brand' ? '': className === 'category' ? 'fa-times-category':'');
      customDropdwonContainer.style.display = 'none';
      index = -1;
    }
    // Apply new highlight
    if (index >= 0) {
      brandArray2[index].style.backgroundColor = 'grey';

      // Check if the selected option is out of view and scroll to it
      const option = brandArray2[index];
      const dropdown = customDropdwon; // Dropdown container
      
      // Check if the selected option is out of the visible area
      if (option.offsetTop + option.offsetHeight > dropdown.scrollTop + dropdown.clientHeight) {
        dropdown.scrollTop = option.offsetTop + option.offsetHeight - dropdown.clientHeight; // Scroll down
      } else if (option.offsetTop < dropdown.scrollTop) {
        dropdown.scrollTop = option.offsetTop; // Scroll up
      }
    }
  });
}

function clickSpan(brandDiv, eTarget, brandDivArroWIcon, faTimes) {
  brandDiv.innerHTML = eTarget.innerHTML;
  brandDiv.style.color = 'white';
  brandDivArroWIcon.style.display = 'none';
  fetchItems();
  const removeIcon = document.createElement('i');
  if (faTimes === '') {if (document.querySelector('.select-brand-icon-div').querySelector('.fa-times')) return}
  if (faTimes === 'fa-times-category') {if (document.querySelector('.select-category-icon-div').querySelector('.fa-times-category')) return}
  
  removeIcon.innerHTML = `<i class="fas fa-times ${faTimes}"></i>`
  brandDiv.parentElement.appendChild(removeIcon);
  removeIcon.addEventListener('click', () => {
  brandDivArroWIcon.style.display = '';
  removeIcon.remove();
  if (faTimes === '') {brandDiv.innerHTML = 'Select brand..';}
  if (faTimes === 'fa-times-category') {brandDiv.innerHTML = 'Select category..';}
  brandDiv.style.color = 'rgb(185, 183, 183)';
  fetchItems();
  })
  customDropdwonContainer.style.display = 'none';
  //customDropdwon.remove();
}

// Eyelash icon
document.querySelector('.fa-eye-slash').addEventListener('click', function () {
  this.classList.toggle('fa-eye-slash'); // Hide icon
  this.classList.toggle('fa-eye'); // Show icon

  const buyPriceTh = document.querySelector('.buyPrice-th');
  const buyPriceTds = document.querySelectorAll('.buyPrice-td');
  buyPriceTh.style.display = (buyPriceTh.style.display === 'none') ? 'table-cell': 'none';
  buyPriceTds.forEach(td => {td.style.display = (td.style.display === 'none') ? 'table-cell': 'none';});
})

// Disable icon
document.querySelector('.fa-toggle-off').addEventListener('click', function () {
  this.classList.toggle('fa-toggle-off');
  this.classList.toggle('fa-toggle-on');
  applyCombinedFilters()
})

// Excel icon
function toggleSlash() {
  const printContainerDiv = document.querySelector('.print-container-div');
  printContainerDiv.classList.toggle('active');
  applyCombinedFilters();
}

// Getting zero prices
function getZeroPrices() {
  const zeroIcon = document.querySelector('.zero');
  zeroIcon.style.backgroundColor = (zeroIcon.style.backgroundColor === '' ? '#65a7d7': '');
  zeroIcon.style.color = (zeroIcon.style.color === '' ? 'white': '');
  applyCombinedFilters()
}

// Export to excel
async function exportToExcel() {
  const rows = Array.from(tableTBody.children); // Get all rows in table body
  const tableData = [];

  // Loop through each row to extract data
  rows.forEach((row) => {
    const rowData = [];
    row.querySelectorAll('td').forEach(cell => {
      if (
        cell.classList.contains('delete-td') ||
        cell.classList.contains('edit-td') ||
        cell.classList.contains('disable-td') ||
        cell.classList.contains('noExcel-td') ||
        cell.classList.contains('dis-or-td') ||
        cell.classList.contains('order-num-td') ||
        cell.classList.contains('changing-id-td')
      ) return
      rowData.push(cell.innerText); // Collect the cell data
    });
    tableData.push(rowData); // Add row data to tableData array
  });
  // Now send the data to the server for export
  try {
    const response = await fetch(`http://${serverIP}:${port}/export-excel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items: tableData }), // Send the table data
    });

    if (response.ok) {
      // Download the file
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "items.xlsx";
      link.click();
    } else {
      alert("Error exporting data");
    }
  } catch (error) {
    console.error("Error exporting data:", error);
    alert("An error occurred while exporting.");
  }
}

// Update an item discription
const discountTextarea = document.querySelector('.discount-textarea');
const modalContainerDiv = document.querySelector('.modal-container-div');
const applyDiscountButt = document.querySelector('.apply-discount-butt');
async function addDiscription(event) {
  const itemId = event.target.closest('tr').querySelector('.id-td').innerHTML;
  const response = await fetch(`http://${serverIP}:${port}/items/${itemId}`);
  const item = await response.json();
  discountTextarea.value = item.discription;
  modalContainerDiv.classList.remove('hidden');
  modalContainerDiv.classList.add('show');
  setTimeout(() => {
    discountTextarea.focus();
  }, 100);

  discountTextarea.addEventListener('keydown', handleKeydown);
  applyDiscountButt.addEventListener('click', applyDiscription);

  function handleKeydown(e) {
    if (e.key === 'Enter' && e.shiftKey) {
      return
    } else if (e.key === 'Enter') {
      if (modalContainerDiv.classList.contains('show')) {
        e.preventDefault();
        updateDiscription();
        //modalContainerDiv.style.display = 'none';
        modalContainerDiv.classList.remove('show');
        modalContainerDiv.classList.add('hidden');
      }
    }
  }
  
  function applyDiscription() {
    updateDiscription();
    modalContainerDiv.classList.remove('show');
    modalContainerDiv.classList.add('hidden');
  }

  async function updateDiscription() {
    discountTextarea.removeEventListener('keydown', handleKeydown);
    applyDiscountButt.removeEventListener('click', applyDiscription);
    await fetch(`http://${serverIP}:${port}/items/${itemId}`, {
      method: 'PUT', 
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        discription: discountTextarea.value.trim()
      })
    });
  }
  modalContainerDiv.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-container-div') || (e.target.classList.contains('close-sign-span'))) {
      //modalContainerDiv.style.display = 'none';
      modalContainerDiv.classList.remove('show');
      modalContainerDiv.classList.add('hidden');
      discountTextarea.removeEventListener('keydown', handleKeydown);
      applyDiscountButt.removeEventListener('click', applyDiscription);
    }
  })
}

const totalBuySpan = document.querySelector('.total-buy-span');
function updateTotal() {
  let total = 0;
  const rowArray = Array.from(tableTBody.children);
  rowArray.forEach(tr => {
    const splittedQnt = tr.querySelector('.quantity-td').innerHTML.split('+');
    const realQnt = splittedQnt[0];
    const eachItemTotal = Number(realQnt) * Number(tr.querySelector('.buyPrice-td').innerHTML);
    total += eachItemTotal;
    totalBuySpan.innerHTML = Number(Number(total).toFixed(3)).toLocaleString();
  })
}

inpValResetterIcon.addEventListener('click', function() {
  searchInp.value = '';
  this.style.display = 'none';
  fetchItems();
  searchInp.focus();
})

// Createing the excel
document.querySelector('.excel-file-inp').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  
  reader.onload = async function(e) {
    // 1. Get the file data as array buffer
    const data = new Uint8Array(e.target.result);
    
    // 2. Parse the Excel file
    const workbook = XLSX.read(data, { type: 'array' });
    
    // 3. Get the first worksheet
    const firstSheetName = workbook.SheetNames[0];
    const firstSheet = workbook.Sheets[firstSheetName];
    
    // 4. Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
    for(const item of jsonData) {
      const id = Number(item.Id);
      const buyPrice = Number(item.buyPrice)
      await fetch(`http://${serverIP}:${port}/items/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          buyPrice: buyPrice
        })
      })
    }
    };
  reader.readAsArrayBuffer(file);
});

async function resetItemQuantities(params) {
  const response = await fetch(`http://${serverIP}:${port}/items`);
  const items = await response.json();
  for(const [index, item] of items.entries()) {
    searchInp.value = index + 1;
    const id = item.id;
    const response = await fetch(`http://${serverIP}:${port}/stockentinvs`);
    const stockInvs = await response.json();
    const filteredArrey = stockInvs.filter(inv => inv.items.some(item => item.itemId === id) && inv.invStatus !== 'Pending');
    let totalQuantity = 0;
    for(const inv of filteredArrey) {inv.items.forEach(item => {if (item.itemId === id) totalQuantity += item.lastQuantity})};
    const itemResponse = await fetch(`http://${serverIP}:${port}/items/${id}`);
    const item2 = await itemResponse.json();
    if (totalQuantity !== item2.quantity) {
      await fetch(`http://${serverIP}:${port}/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: totalQuantity
        })
      });
      function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }

    searchInp.value = `${item2.brand_name} ${item2.model_name} ${item2.category_name} ${item2.quality_name}`;
    await delay(2000); // This actually waits 2 seconds
    }
  }
  searchInp.value = 'Finished';
}

searchInp.addEventListener('keydown', function(e) {if (e.ctrlKey && e.key === 'Enter') resetItemQuantities();})

const changingIdTh = document.querySelector('.changing-id-th');
changingIdTh.addEventListener('click', async function() {
  const response = await fetch(`http://${serverIP}:${port}/items`);
  const items = await response.json();
  const biggestChangingId = Math.max(...items.map(item => item.changingId)) + 1;
  alert(biggestChangingId)
})