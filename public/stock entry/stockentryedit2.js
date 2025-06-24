const currentInvoiceId = JSON.parse(localStorage.getItem('currentInvoiceId')) || [];
const stockEntryForm = document.querySelector('.stock-entry-form');
const cancelButt = document.querySelector('.cancel-butt');
const saveButt = document.querySelector('.save-butt2');
const addItemButt = document.querySelector('.add-item-butt');
const stockentryForm = document.querySelector('.stock-entry-form');
const submitButt = document.querySelector('.submit-butt2');
const quantityInps = document.querySelectorAll('.quantity-inp');
const skuInp = document.querySelector('.sku-inp')
const remarkInp = document.querySelector('.remark-inp');
const ballIcon = document.querySelector('.fa-circle');
const invoiceStatusSpan = document.querySelector('.invoice-status-span');
const excelIcon = document.querySelector('.fa-file-excel');
const searchInp = document.querySelector('.search-inp');
searchInp.value = localStorage.getItem('searchInpVal') || '';

if (localStorage.getItem('hideSaveButt') === 'true') {
  saveButt.style.display = 'none';
  localStorage.removeItem('hideSaveButt'); // Reset the flag after applying
}
if (localStorage.getItem('submitButtonDisabled') === 'false') {
  submitButt.disabled = false
  localStorage.removeItem('submitButtonDisabled');
}

const customDropdwonSpans = [];
let itemIdList = [];
async function fetchAllItems() {
  const response = await fetch(`http://${serverIP}:${port}/items`);
  const items = await response.json();
  itemIdList = items.map(item => item.id);
}

async function fetchItems(newInp) {
  const updatedInpVal = newInp ? newInp.value.trim().toLocaleLowerCase() : '';  
  const response = await fetch(`http://${serverIP}:${port}/itemsFilter?search=${updatedInpVal}`);
  const items = await response.json();
  items.forEach(item => {
    if (item.disable === 'checked') return;
    const span = document.createElement('span')
    span.className = 'item-span'
    span.innerHTML = item.brand_name + ' ' + item.model_name + ' ' + item.category_name + ' ' + item.quality_name + `<span class="sku-box-span" style="display: none;">${item.SKU || ''}${item.boxId || ''}</span>`;
    span.setAttribute('data-id', item.id);
    customDropdwonSpans.push(span);
  });
}

fetchItems();
fetchAllItems();

async function createDropdown(event) {
  const stockResponse = await fetch(`http://${serverIP}:${port}/stockentinvs/${currentInvoiceId}`);
  const invoice = await stockResponse.json();
  if (invoice.invStatus !== 'Pending') return;
  customDropdwonSpans.length = 0;
  await fetchItems();
  const customDropdwonContainer = document.createElement('div');
  customDropdwonContainer.className = 'input-container-div';
  customDropdwonContainer.spellcheck = false;
  const newInp = document.createElement('input');
  newInp.className = 'new-inp';
  const customDropdwon = document.createElement('div');
  customDropdwon.className = 'costum-dropdwon';
  document.body.appendChild(customDropdwonContainer);

  customDropdwonContainer.appendChild(newInp)
  customDropdwonContainer.appendChild(customDropdwon);
  customDropdwonSpans.forEach(span => {customDropdwon.appendChild(span)});
  document.body.appendChild(customDropdwonContainer);
  const indexSpan = event.target.previousElementSibling;
  const rect = indexSpan.getBoundingClientRect();
  customDropdwonContainer.style.display = 'flex';
  customDropdwonContainer.style.position = 'absolute';
  customDropdwonContainer.style.top = `${rect.top + 40}px`;
  newInp.focus();
  const newDiv = event.target;
  const taregtBuyPriceInp = newDiv.closest('.container-div').querySelector('.buy-price-inp');
  searchItem(customDropdwon, newInp, newDiv, customDropdwonContainer, customDropdwonSpans);
  function handleSpanClick(e) {
    newDiv.innerHTML = e.target.innerHTML;
    const itemId = Number(e.target.getAttribute('data-id'));
    newDiv.setAttribute('data-id', e.target.getAttribute('data-id'))
    fetch(`http://${serverIP}:${port}/items/${itemId}`)
      .then(response => response.json())
      .then(targetItem => {
        taregtBuyPriceInp.value = Number(targetItem.buyPrice);
        resetButtons();
        updateTotal();
      });
  }
  for(const span of Array.from(customDropdwon.children)) {
      span.addEventListener('click', handleSpanClick);
  }
  newInp.addEventListener('blur', () => {
    setTimeout(() => {
      customDropdwon.remove();
      newInp.remove();
      customDropdwonContainer.remove();
      for (const span of customDropdwon.children) {
        span.removeEventListener('click', handleSpanClick);
      }
    }, 100); // Delay hiding to allow the click event to register
    updateTotal();
  });
}

let orderNum = 0;
async function fetchCurrentInv() {
  const response = await fetch(`http://${serverIP}:${port}/stockentinvs/${currentInvoiceId}`);
  const currentIdInvoice = await response.json();
  skuInp.value = currentIdInvoice.sku;
  remarkInp.value = currentIdInvoice.remark;

  const targetItems = currentIdInvoice.items;
  for(const item of targetItems) {
    const itemId = item.itemId;
    const response = await fetch(`http://${serverIP}:${port}/items/${itemId}`);
    const tableItem = await response.json();
    orderNum += 1
    const newItemDiv = document.createElement('div');
    newItemDiv.className = 'container-div';
    newItemDiv.innerHTML = `
    <span class="index">${orderNum}</span>
    <div class="new-div" data-id="${tableItem.id}" oninput="resetButtons()" onclick="createDropdown(event)">${tableItem.brand_name + ' ' + tableItem.model_name + ' ' + tableItem.category_name + ' ' + tableItem.quality_name + `<span class="sku-box-span" style="display: none;">${tableItem.SKU || ''}${tableItem.boxId || ''}</span>`}</div>
    <input type="password" value="${item.buyPrice}" class="buy-price-inp" step="any"
  onkeydown="if (
      !/^[0-9.]$/.test(event.key) &&
      !(event.ctrlKey && ['v', 'z', 'a', 'x', 'c'].includes(event.key.toLowerCase())) &&
      !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowRight', 'ArrowLeft'].includes(event.key)
  ) event.preventDefault();
  if (event.key === '.' && this.value.includes('.')) event.preventDefault();"
  oninput="resetButtons();updateTotal();">
    <div class="two-quantity-div">
      <input type="number" value="${item.quantity}" class="quantity-inp" onkeydown="if (!/^[0-9]$/.test(event.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowRight', 'ArrowLeft'].includes(event.key)) event.preventDefault();" oninput="resetButtons();updateTotal();">
      <div class="last-quantity-div"">${item.lastQuantity}</div>
    </div>
    <i class="fas fa-trash delete-icon" onclick="deleteDiv(event); updateTotal();" style="display: none;"></i>
    `
    stockEntryForm.appendChild(newItemDiv);
    focusNextInput(newItemDiv.querySelector('.buy-price-inp'), 'buy-price');
    focusNextInput(newItemDiv.querySelector('.quantity-inp'), 'quantity');

    if (currentIdInvoice.invStatus === 'Pending') {
      const deleteIcons = document.querySelectorAll('.delete-icon');
      deleteIcons.forEach(icon => {
        icon.style.display = '';
      })
    }
    if (currentIdInvoice.invStatus !== 'Pending') {
      const quantityInps = document.querySelectorAll('.quantity-inp');
      quantityInps.forEach(qntInput => {
      qntInput.disabled = true;
      });
    }
    updateTotal();
    let totalExistingItem = 0;
    findItem(searchInp.value, totalExistingItem)
  }
}
fetchCurrentInv();

addItemButt.addEventListener('click', () => {
  const eyeIcon = document.querySelector('.eye-icon');
  resetButtons();
  orderNum += 1;
  const newItemDiv = document.createElement('div');
  newItemDiv.className = 'container-div';
  newItemDiv.innerHTML = `
  <span class="index">${orderNum}</span>
  <div class="new-div">Select...</div>
  <input type="${eyeIcon.classList.contains("fa-eye-slash") ? 'password': 'number'}" value="0" class="buy-price-inp" step="any" onkeydown="if (
      !/^[0-9.]$/.test(event.key) &&
      !(event.ctrlKey && ['v', 'z', 'a', 'x', 'c'].includes(event.key.toLowerCase())) &&
      !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowRight', 'ArrowLeft'].includes(event.key)) event.preventDefault();if (event.key === '.' && this.value.includes('.')) event.preventDefault();" oninput="resetButtons();updateTotal();">
  <div class="two-quantity-div">
    <input type="number" value="0" class="quantity-inp" onkeydown="if (!/^[0-9]$/.test(event.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowRight', 'ArrowLeft'].includes(event.key)) event.preventDefault();" oninput="resetButtons();updateTotal();">
    <div class="last-quantity-div">0</div>
  </div>
  <i class="fas fa-trash delete-icon" onclick="deleteDiv(event);updateTotal();"></i>
  `
  const newDiv = newItemDiv.querySelector('.new-div');
  newDiv.addEventListener('click', async function (e) {
    customDropdwonSpans.length = 0;
    await fetchItems();
    const customDropdwonContainer = document.createElement('div');
    customDropdwonContainer.className = 'input-container-div';
    customDropdwonContainer.spellcheck = false;
    const newInp = document.createElement('input');
    newInp.className = 'new-inp';
    const customDropdwon = document.createElement('div');
    customDropdwon.className = 'costum-dropdwon';

    customDropdwonSpans.forEach(span => {customDropdwon.appendChild(span)});
    document.body.appendChild(customDropdwonContainer);
    customDropdwonContainer.appendChild(newInp)
    customDropdwonContainer.appendChild(customDropdwon);
    customDropdwonContainer.style.display = 'flex';
    customDropdwonContainer.style.position = 'absolute';
    const indexSpan = e.target.previousElementSibling;
    const rect = indexSpan.getBoundingClientRect();
    customDropdwonContainer.style.top = `${rect.top + 40}px`;
    newInp.focus();

    const taregtBuyPriceInp = this.closest('.container-div').querySelector('.buy-price-inp');
    searchItem(customDropdwon, newInp, newDiv, customDropdwonContainer, customDropdwonSpans)
    function handleSpanClick(e) {
      newDiv.innerHTML = e.target.innerHTML;
      const itemId = Number(e.target.getAttribute('data-id'));
      newDiv.setAttribute('data-id', e.target.getAttribute('data-id'));
      fetch(`http://${serverIP}:${port}/items/${itemId}`)
        .then(response => response.json())
        .then(targetItem => {
          taregtBuyPriceInp.value = Number(targetItem.buyPrice);
          resetButtons();
          updateTotal();
        });
    }
    for(const span of Array.from(customDropdwon.children)) {
        span.addEventListener('click', handleSpanClick);
    }
    newInp.addEventListener('blur', () => {
      setTimeout(() => {
        customDropdwon.remove();
        newInp.remove();
        customDropdwonContainer.remove();
        for(const span of Array.from(customDropdwon.children)) {
          span.removeEventListener('click', handleSpanClick);
        }
      }, 100); // Delay hiding to allow the click event to register
      updateTotal();
    });
  })
  stockentryForm.appendChild(newItemDiv);
  focusNextInput(newItemDiv.querySelector('.buy-price-inp'), 'buy-price');
  focusNextInput(newItemDiv.querySelector('.quantity-inp'), 'quantity');
});

function deleteDiv(event) {
  event.target.closest('.container-div').remove();
  resetButtons();
  const spans = document.querySelectorAll('.index');
  if (spans.length === 0) {orderNum = 0; return}
  spans.forEach((span, index) => {
    span.innerHTML = index + 1;
    orderNum = index + 1;
  });
};

function resetButtons() {
  fetch(`http://${serverIP}:${port}/stockentinvs/${currentInvoiceId}`)
  .then(response => response.json())
  .then(currentIdInvoice => {
    if (currentIdInvoice.invStatus === 'Pending') {
      submitButt.disabled = true;
      saveButt.style.display = '';
    }
  }
  )
}

// Check the invoice the status
fetch(`http://${serverIP}:${port}/stockentinvs/${currentInvoiceId}`)
.then(response => response.json())
.then(currentIdInvoice => {
  if (currentIdInvoice.invStatus === 'Pending') {
    const quantityInps = document.querySelectorAll('.quantity-inp');
    addItemButt.style.display = '';
    quantityInps.forEach(qntInput => {
      qntInput.disabled = false;
      });
    cancelButt.style.display = 'none';
    const checkboxInp = document.querySelector('.checkbox-inp');

    saveButt.addEventListener('click', async () => {
      const newDivs = document.querySelectorAll('.new-div');
      const buyPriceInps = document.querySelectorAll('.buy-price-inp');
      const quantityInps = document.querySelectorAll('.quantity-inp');
      const checkboxInp = document.querySelector('.checkbox-inp');

      if(!newDivs[0]) {
        Toastify({
          text: `Please select an item`,
          duration: 3000,
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
      for(const newDiv of newDivs) {
        if (newDiv.innerHTML === 'Select...') {
          newDiv.style.background = 'rgb(167, 66, 66)';
          const index = newDiv.closest('.container-div').querySelector('.index').innerHTML;
          Toastify({
            text: `Item is empty at index: ${index}`,
            duration: 3000,
            gravity: 'top', // or 'top'
            position: 'center', // or 'right', 'center'
            style: {
              background: 'rgb(154, 59, 59)',
              borderRadius: '10px',
            },
            stopOnFocus: true,
          }).showToast();
          return
        };
        newDiv.style.background = '';
      }
      saveButt.disabled = true;
      saveButt.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

      for(const [index, newDiv] of newDivs.entries()) {
        newDiv.style.background = '';
      }
      for(const input of quantityInps) {
        input.style.background = '';
      }
      const mySet = new Set();
      const mySet2 = new Set();
      for(const [index, div] of newDivs.entries()) {
        if (quantityInps[index].value === '0' || quantityInps[index].value === '') {
          quantityInps[index].style.background = 'rgb(167, 66, 66)';
          saveButt.disabled = false;
          saveButt.innerHTML = 'Save';
          const TargetIndex = div.closest('.container-div').querySelector('.index').innerHTML;
          Toastify({
            text: `Item quantity is invalid at index: ${TargetIndex}`,
            duration: 3000,
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
        if (mySet.has(div.innerHTML) || mySet2.has(div.getAttribute('data-id') === null ? false : div.getAttribute('data-id'))) {
          const selectHTML = div.innerHTML;
          const divAttr = div.getAttribute('data-id');
          const invalidIndixes = [];
          newDivs.forEach(div2 => {
            if (selectHTML === div2.innerHTML) {
              div2.style.background = 'blue';
              const index = div2.closest('.container-div').querySelector('.index').innerHTML;
              invalidIndixes.push(index);
            }
            if (divAttr === null ? false :  divAttr === div2.getAttribute('data-id')) {
              div2.style.background = 'blue';
            }
          })
          saveButt.disabled = false;
          saveButt.innerHTML = 'Save';
          div.style.background = 'blue';
          if (invalidIndixes.length > 0) {
            Toastify({
              text: `Item is repeated at index(es): ${invalidIndixes.join(', ')}`,
              duration: 3000,
              gravity: 'top', // or 'top'
              position: 'center', // or 'right', 'center'
              style: {
                background: 'rgb(154, 59, 59)',
                borderRadius: '10px',
              },
              stopOnFocus: true,
            }).showToast();
          }
          return;
        }
        mySet.add(div.innerHTML)
        mySet2.add(div.getAttribute('data-id'));
      }
      const invoiceData = [];
      for(const [index, newDiv] of newDivs.entries()) {
        for(const div of newDivs) {
          if (div.getAttribute('data-id')) {
            if (div.getAttribute('data-id') === 'NaN') {div.style.background = 'rgb(154, 59, 59)';saveButt.disabled = false;saveButt.innerHTML = 'Save';
              const targetIndex = div.closest('.container-div').querySelector('.index').innerHTML;
              Toastify({
                text: `Item id is invalid at index: ${targetIndex}`,
                duration: 3000,
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
            if (!itemIdList.includes(Number(div.getAttribute('data-id')))) {div.style.background = 'rgb(154, 59, 59)';saveButt.disabled = false;saveButt.innerHTML = 'Save';
              const targetIndex = div.closest('.container-div').querySelector('.index').innerHTML;
              Toastify({
                text: `Item id is invalid at index: ${targetIndex}`,
                duration: 3000,
                gravity: 'top', // or 'top'
                position: 'center', // or 'right', 'center'
                style: {
                  background: 'rgb(154, 59, 59)',
                  borderRadius: '10px',
                },
                stopOnFocus: true,
              }).showToast();
              console.log('yes')
              return;
            };
          }
        }
        const itemId = parseInt(newDiv.getAttribute('data-id')); //Needed
        const response = await fetch(`http://${serverIP}:${port}/items/${itemId}`);//Needed
        const targetItem = await response.json();//Needed
        /*
        const response2 = await fetch(`http://${serverIP}:${port}/stockentinvs/${currentInvoiceId}`);
        const updatedCurrentInvoice = await response2.json();
        console.log(itemId, updatedCurrentInvoice)
        const wantedItem = updatedCurrentInvoice.items.find(item => item.itemId === targetItem.id);
        console.log(wantedItem)
        await fetch(`http://${serverIP}:${port}/items/${targetItem.id}`, {
          method:'PUT',
          headers:{'Content-Type': 'application/json'},
          body:JSON.stringify({
            pendingQnt: targetItem.pendingQnt - wantedItem.quantity
          })
        });
        const response3 = await fetch(`http://${serverIP}:${port}/items/${itemId}`);
        const targetItem2 = await response3.json();
        for (const item of updatedCurrentInvoice.items) {
          if (item.itemId === targetItem.id) {
            await fetch(`http://${serverIP}:${port}/items/${targetItem.id}`, {
              method:'PUT',
              headers:{'Content-Type': 'application/json'},
              body:JSON.stringify({
                pendingQnt: targetItem2.pendingQnt +  parseInt(quantityInps[index].value)
              })
            });
          };
        };
        */
        invoiceData.push({
          itemId: targetItem.id,
          brand: targetItem.brand,
          model: targetItem.model,
          category: targetItem.category,
          quality: targetItem.quality,
          buyPrice: parseFloat(buyPriceInps[index].value) || 0,
          quantity: parseInt(quantityInps[index].value) || 0,
          lastQuantity: parseInt(quantityInps[index].value) || 0
        });
        await fetch(`http://${serverIP}:${port}/stockentinvs/${currentInvoiceId}`, {
          method:'PUT',
          headers:{'Content-type': 'application/json'},
          body: JSON.stringify({
            items: JSON.stringify(invoiceData),
            sku: skuInp.value.trim(),
            remark: remarkInp.value.trim()
          })
        });
        if (checkboxInp.checked) {
          await fetch(`http://${serverIP}:${port}/items/${targetItem.id}`, {
            method: 'PUT',
            headers: {'Content-Type' : 'application/json'},
            body: JSON.stringify({
              buyPrice: parseFloat(buyPriceInps[index].value) || 0
            })
          });
        }
      };
      localStorage.setItem('hideSaveButt', 'true'); // Store state before reload
      localStorage.setItem('submitButtonDisabled', 'false'); // Store state before reload
      Toastify({
        text: `Invoice updated!`,
        duration: 3000,
        gravity: 'top', // or 'top'
        position: 'center', // or 'right', 'center'
        style: {
          background: 'rgb(154, 59, 59)',
          borderRadius: '10px',
        },
        stopOnFocus: true,
      }).showToast();
      localStorage.setItem('isInvoiceUpdated', 'true');
      localStorage
      location.reload(true);
    });

    submitButt.addEventListener('click', async () => {
      const response = await fetch(`http://${serverIP}:${port}/stockentinvs/${currentInvoiceId}`);
      const currentInv = await response.json();
      if (currentInv.invStatus !== 'Pending') 
        return Toastify({
          text: `This invoice is already submitted!`,
          duration: 2000,
          gravity: 'top', // or 'top'
          position: 'center', // or 'right', 'center'
          style: {
            background: 'brown',
            borderRadius: '10px',
          },
          stopOnFocus: true,
        }).showToast();;
      console.log(currentInv)
      submitButt.disabled = true;
      submitButt.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      const quantityInps1 = document.querySelectorAll('.quantity-inp');
      for(const input of quantityInps1) {
        input.style.background = '';
      }
      
      await fetch(`http://${serverIP}:${port}/stockentinvs/${currentInvoiceId}`, {
        method:'PUT',
        headers:{'Content-type': 'application/json'},
        body: JSON.stringify({
          invStatus: 'Submitted'
        })
      });

      const newDivs = document.querySelectorAll('.new-div');
      const buyPriceInps = document.querySelectorAll('.buy-price-inp');
      const quantityInps = document.querySelectorAll('.quantity-inp');

      for(const [index, newDiv] of newDivs.entries()) {
        const itemId = parseInt(newDiv.getAttribute('data-id'));
        const response = await fetch(`http://${serverIP}:${port}/items/${itemId}`);
        const targetItem = await response.json();

        targetItem.quantity += parseInt(quantityInps[index].value) || 0;
        await fetch(`http://${serverIP}:${port}/items/${itemId}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body:JSON.stringify({
            quantity: targetItem.quantity
          })
        });

        targetItem.pendingQnt -= parseInt(quantityInps[index].value) || 0;
        await fetch(`http://${serverIP}:${port}/items/${itemId}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body:JSON.stringify({
            pendingQnt: targetItem.pendingQnt
          })
        });

        if (checkboxInp.checked) {
          targetItem.buyPrice = parseFloat(buyPriceInps[index].value || 0);
          await fetch(`http://${serverIP}:${port}/items/${itemId}`, {
            method: 'PUT',
            headers: {'Content-Type' : 'application/json'},
            body: JSON.stringify({
              buyPrice: targetItem.buyPrice
            })
          });
        };
      };
      localStorage.setItem('isInvoiceSubmitted', 'true');
      
      document.body.classList.add('animate-out');
      setTimeout(() => {
       window.location.href = 'stockentry.html';
      }, 200)
    });
  } else if (currentIdInvoice.invStatus === 'Canceled') {
    saveButt.style.display = 'none';
    cancelButt.disabled = true;
    submitButt.disabled = false;
    const checkboxInp = document.querySelector('.checkbox-inp');
    submitButt.addEventListener('click', async () => {
      await fetch(`http://${serverIP}:${port}/stockentinvs/${currentInvoiceId}`, {
        method:'PUT',
        headers:{'Content-type': 'application/json'},
        body: JSON.stringify({
          invStatus: 'Submitted',
          sku: skuInp.value.trim(),
          remark: remarkInp.value.trim()
        })
      });
      const buyPriceInps = document.querySelectorAll('.buy-price-inp');
      if (checkboxInp.checked) {
        const response = await fetch(`http://${serverIP}:${port}/stockentinvs/${currentInvoiceId}`);
        const currentIdInvoice = await response.json();
        const targetItems = currentIdInvoice.items;
  
        for(let index = 0; index < targetItems.length; index++) {
          const item = targetItems[index];
  
          item.buyPrice = parseFloat(buyPriceInps[index].value || 0);
          await fetch(`http://${serverIP}:${port}/items/${item.itemId}`, {
            method: 'PUT',
            headers: {'Content-Type' : 'application/json'},
            body: JSON.stringify({
              buyPrice: item.buyPrice
            })
          });
        };
      };
      localStorage.setItem('isInvoiceSubmitted', 'true');
      document.body.classList.add('animate-out');
      setTimeout(() => {
        window.location.href = 'stockentry.html';
      }, 200)
    });
    ballIcon.style.color = 'rgb(224, 175, 60)';
    invoiceStatusSpan.style.color = 'rgb(224, 175, 60)';
    invoiceStatusSpan.innerHTML = 'Canceled';
    addItemButt.style.display = 'none';
    excelIcon.style.display = 'none';
  } else if (currentIdInvoice.invStatus === 'Submitted') {
    saveButt.style.display = 'none';
    ballIcon.style.color = 'rgb(60, 224, 161)';
    invoiceStatusSpan.style.color = 'rgb(60, 224, 161)';
    invoiceStatusSpan.innerHTML = 'Submitted';
    addItemButt.style.display = 'none';
    excelIcon.style.display = 'none';
  }
});

cancelButt.addEventListener('click', async () => {
  cancelButt.disabled = true;
  cancelButt.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  await fetch(`http://${serverIP}:${port}/stockentinvs/${currentInvoiceId}`, {
    method:'PUT',
    headers:{'Content-type': 'application/json'},
    body: JSON.stringify({
      invStatus: 'Canceled'
    })
  })

  cancelButt.disabled = true;
  submitButt.disabled = false;
  const checkboxInp = document.querySelector('.checkbox-inp');
  Toastify({
    text: `Invoice canceled!`,
    duration: 2000,
    gravity: 'top', // or 'top'
    position: 'center', // or 'right', 'center'
    style: {
      background: 'rgb(61, 183, 138)',
      borderRadius: '10px',
    },
    stopOnFocus: true,
  }).showToast();
  submitButt.addEventListener('click', async () => {
    submitButt.disabled = true;
    submitButt.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    await fetch(`http://${serverIP}:${port}/stockentinvs/${currentInvoiceId}`, {
      method:'PUT',
      headers:{'Content-type': 'application/json'},
      body: JSON.stringify({
        invStatus: 'Submitted',
        sku: skuInp.value.trim(),
        remark: remarkInp.value.trim()
      })
    });
    const buyPriceInps = document.querySelectorAll('.buy-price-inp');
    
    const response = await fetch(`http://${serverIP}:${port}/stockentinvs/${currentInvoiceId}`);
    const currentIdInvoice = await response.json();
    const targetItems = currentIdInvoice.items;
    for(let index = 0; index < targetItems.length; index++) {
      const item = targetItems[index];

      item.buyPrice = parseFloat(buyPriceInps[index].value || 0);
      targetItems[index].buyPrice = item.buyPrice;

    if (checkboxInp.checked) {
        await fetch(`http://${serverIP}:${port}/items/${item.itemId}`, {
          method: 'PUT',
          headers: {'Content-Type' : 'application/json'},
          body: JSON.stringify({
            buyPrice: item.buyPrice
          })
        });
      };
    };
    await fetch(`http://${serverIP}:${port}/stockentinvs/${currentInvoiceId}`, {
      method:'PUT',
      headers:{'Content-type': 'application/json'},
      body: JSON.stringify({
        items: JSON.stringify(targetItems)
      })
    });
    localStorage.setItem('isInvoiceSubmitted', 'true');
    document.body.classList.add('animate-out');
    setTimeout(() => {
      window.location.href = 'stockentry.html';
    }, 200)
  });
  cancelButt.innerHTML = 'Cancel';
  ballIcon.style.color = 'rgb(224, 175, 60)';
  invoiceStatusSpan.style.color = 'rgb(224, 175, 60)';
  invoiceStatusSpan.innerHTML = 'Canceled';
});

function searchItem(customDropdwon, newInp, newDiv, customDropdwonContainer, customDropdwonSpans) {
  let index = -1;
  newInp.addEventListener('input', async () => {
    customDropdwonSpans.length = 0;
    index = -1;
    customDropdwon.innerHTML = '';
    const updatedInpVal = newInp.value.trim().toLocaleLowerCase();
    const splittedValue = updatedInpVal.split(' ');
    await fetchItems(newInp);
    const lastArray = customDropdwonSpans.filter(brand => splittedValue.every(term => (brand.innerHTML + brand.querySelector('.sku-box-span').innerHTML).toLocaleLowerCase().includes(term)));
    const taregtBuyPriceInp = newDiv.closest('.container-div').querySelector('.buy-price-inp');
    function handleSpanClick(e) {
      newDiv.innerHTML = e.target.innerHTML;
      const itemId = Number(e.target.getAttribute('data-id'));
      newDiv.setAttribute('data-id', e.target.getAttribute('data-id'));
      fetch(`http://${serverIP}:${port}/items/${itemId}`)
        .then(response => response.json())
        .then(targetItem => {
          taregtBuyPriceInp.value = Number(targetItem.buyPrice);
          resetButtons();
          updateTotal();
        });
    }
    lastArray.forEach(brand => {
      const span = document.createElement('span');
      span.className = `item-span`
      span.innerHTML = brand.innerHTML;
      span.setAttribute('data-id', brand.getAttribute('data-id'));
      span.addEventListener('click', handleSpanClick, { once: true});
      customDropdwon.appendChild(span);
    });
  })
  newInp.addEventListener('keydown', (e) => {
    const brandArray2 = Array.from(customDropdwon.children);
    const taregtBuyPriceInp = newDiv.closest('.container-div').querySelector('.buy-price-inp');
    function handleSpanClick(e, attribute) {
      newDiv.innerHTML = brandArray2[index].innerHTML;
      const itemId = Number(attribute);
      newDiv.setAttribute('data-id', attribute)
      fetch(`http://${serverIP}:${port}/items/${itemId}`)
        .then(response => response.json())
        .then(targetItem => {
          taregtBuyPriceInp.value = Number(targetItem.buyPrice);
          resetButtons();
          updateTotal();
        });
    }
    if (!brandArray2.length) return; // Exit if no items
  
    // Remove previous highlight
    if (index >= 0) brandArray2[index].style.backgroundColor = '';
  
    if (e.key === 'ArrowDown') {
      index = Math.min(index + 1, brandArray2.length - 1); // Ensure it doesn't go beyond the last item
    } else if (e.key === 'ArrowUp') {
      index = Math.max(index - 1, -1); // Ensure it doesn't go below -1
    } else if (e.key === 'Enter') {
      customDropdwonContainer.remove();
      customDropdwon.remove();
      newInp.remove();
      handleSpanClick(e, brandArray2[index].getAttribute('data-id'));
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
};

// Find item input
searchInp.addEventListener('input', function () {
  Array.from(stockentryForm.children).forEach(itemDiv => {
    itemDiv.querySelector('.new-div').style.color = '';
  })
  const updatedValue = this.value.trim().toLocaleLowerCase();
  let totalExistingItem = 0;
  findItem(updatedValue, totalExistingItem)
})

function findItem(updatedValue, totalExistingItem) {
  const existingItemPar = document.querySelector('.existing-item-par');
  const splittedValue = updatedValue.toLocaleLowerCase().trim().split(' ');
  if (updatedValue.trim() === '') {
    existingItemPar.innerHTML = 0;
    return;
  }

  let firstMatchFound = false;
  totalExistingItem = 0;

  Array.from(stockentryForm.children).forEach(itemDiv => {
    const newDiv = itemDiv.querySelector('.new-div');
    const itemText = newDiv.innerHTML.toLocaleLowerCase();

    if (splittedValue.every(term => itemText.includes(term))) {
      totalExistingItem += 1;
      newDiv.style.color = 'yellow';

      if (!firstMatchFound) {
        itemDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstMatchFound = true;
      }
    } else {
      newDiv.style.color = ''; // Reset color if not matched
    }
  });
  existingItemPar.innerHTML = totalExistingItem;
}

// eye Icon
document.querySelector('.fa-eye-slash').addEventListener('click', function () {
  this.classList.toggle('fa-eye-slash');
  this.classList.toggle('fa-eye');

  hideBuyPrices(this)
})

function hideBuyPrices(eyeIcon) {
  Array.from(stockentryForm.children).forEach(containerDiv => {
    if (!containerDiv.querySelector('.buy-price-inp')) return
    if (eyeIcon.classList.contains('fa-eye-slash')) {
      containerDiv.querySelector('.buy-price-inp').type = 'password';
    } else {
      containerDiv.querySelector('.buy-price-inp').type = 'text';
    }
  })
}

skuInp.addEventListener('input', () => resetButtons());
remarkInp.addEventListener('input', () => resetButtons());

function updateTotal() {
  const totalIqdSpan = document.querySelector('.total-iqd-span');
  const totalQntSpan = document.querySelector('.total-quantity-span');
  let totalIQD = 0;
  let totalQnt = 0;
  document.querySelectorAll('.buy-price-inp').forEach(input => {
    totalIQD += (Number(input.value) * Number(input.closest('.container-div').querySelector('.quantity-inp').value));
    totalQnt += Number(input.closest('.container-div').querySelector('.quantity-inp').value);
  });
  totalIqdSpan.innerHTML = totalIQD.toLocaleString();
  totalQntSpan.innerHTML = totalQnt;
}

// Creating excel
document.querySelector('.excel-file-inp').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  
  reader.onload = function(e) {
    // 1. Get the file data as array buffer
    const data = new Uint8Array(e.target.result);
    
    // 2. Parse the Excel file
    const workbook = XLSX.read(data, { type: 'array' });
    
    // 3. Get the first worksheet
    const firstSheetName = workbook.SheetNames[0];
    const firstSheet = workbook.Sheets[firstSheetName];
    
    // 4. Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
    stockentryForm.innerHTML = '';
    for(const item of jsonData) {
      const itemId = Number(item.Id);
      const sku = item.SKU;
      const boxId = item['Box ID'];
      const brand = item.Brand;
      const model = item.Model;
      const category = item.Category;
      const quality = item.Quality;
      const buyPrice = Number(item['Buy Price']);
      const quantity = Number(item.Quantity);
      addItemDiv(sku, boxId, itemId, brand, model, category, quality, buyPrice, quantity)
    }
    updateTotal();
    orderNum = 0;
    document.querySelectorAll('.container-div').forEach((div, index) => {
      div.querySelector('.index').innerHTML = index + 1;
      orderNum++
    })
  };
  
  reader.readAsArrayBuffer(file);
});

async function addItemDiv(sku, boxId, itemId, brand, model, category, quality, buyPrice, quantity) {
  const eyeIcon = document.querySelector('.eye-icon');
  orderNum += 1;
  const newItemDiv = document.createElement('div');
  newItemDiv.className = 'container-div';
  newItemDiv.innerHTML = `
  <span class="index">${orderNum}</span>
  <div class="new-div" data-id="${itemId}">${brand + ' ' + model + ' ' + category + ' ' + quality}</div>
  <input type="${eyeIcon.classList.contains("fa-eye-slash") ? 'password': 'number'}" value="${buyPrice}" class="buy-price-inp" step="any" onkeydown="if (
      !/^[0-9.]$/.test(event.key) &&
      !(event.ctrlKey && ['v', 'z', 'a', 'x', 'c'].includes(event.key.toLowerCase())) &&
      !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowRight', 'ArrowLeft'].includes(event.key)) event.preventDefault();if (event.key === '.' && this.value.includes('.')) event.preventDefault();" oninput="resetButtons();updateTotal();">
  <div class="two-quantity-div">
    <input type="number" value="${quantity}" class="quantity-inp" onkeydown="if (['-', 'ArrowUp', 'ArrowDown', 'e', 'E'].includes(event.key)) event.preventDefault();" oninput="updateTotal()">
    <div class="last-quantity-div">0</div>
  </div>
  <i class="fas fa-trash delete-icon" onclick="deleteDiv(event); updateTotal()"></i>
  `
  const customDropdwonContainer = document.createElement('div');
  customDropdwonContainer.className = 'input-container-div';
  customDropdwonContainer.spellcheck = false;
  const newInp = document.createElement('input');
  newInp.className = 'new-inp';
  const customDropdwon = document.createElement('div');
  customDropdwon.className = 'costum-dropdwon';
  const newDiv = newItemDiv.querySelector('.new-div');

  await fetchItems()
  searchItem(customDropdwon, newInp, newDiv, customDropdwonContainer, customDropdwonSpans);

  customDropdwonContainer.appendChild(newInp)
  customDropdwonContainer.appendChild(customDropdwon);

  newDiv.addEventListener('click', async function (e) {
    customDropdwonSpans.length = 0;
    await fetchItems();
    customDropdwonSpans.forEach(span => {customDropdwon.appendChild(span)});
    document.body.appendChild(customDropdwonContainer);
    const indexSpan = e.target.previousElementSibling;
    const rect = indexSpan.getBoundingClientRect();``
    customDropdwonContainer.style.display = 'flex';
    customDropdwonContainer.style.position = 'absolute';
    customDropdwonContainer.style.top = `${rect.top + 40}px`;
    newInp.focus();
    const taregtBuyPriceInp = newItemDiv.querySelector('.buy-price-inp');
    for(const span of Array.from(customDropdwon.children)) {
      span.addEventListener('click', async (e) => {
        newDiv.innerHTML = e.target.innerHTML;
        const itemId = Number(span.getAttribute('data-id'));
        newDiv.setAttribute('data-id', span.getAttribute('data-id'))
        const response = await fetch(`http://${serverIP}:${port}/items/${itemId}`);
        const targetItem = await response.json();
        taregtBuyPriceInp.value = Number(targetItem.buyPrice);
        updateTotal();
      })
    }
    
    newInp.addEventListener('blur', () => {
      setTimeout(() => {
        customDropdwon.innerHTML = '';
        newInp.value = '';
        customDropdwonContainer.style.display = 'none';
      }, 100); // Delay hiding to allow the click event to register
    });
  })
  stockentryForm.appendChild(newItemDiv)
}

function focusNextInput(input, inputType) {
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      const nextInp = e.target.closest('.container-div').nextElementSibling?.querySelector(`.${inputType}-inp`);
      nextInp?.focus();
      nextInp?.select();
    }
  })
}

document.addEventListener('click', function(e) {
  if (e.target.closest('a')) {sessionStorage.removeItem('stockTableScrollPosition')}
})

const isSaved = localStorage.getItem('isInvoiceSaved');
const isUpdated = localStorage.getItem('isInvoiceUpdated');
if (isSaved || isUpdated) {
  if (isSaved)
  Toastify({
    text: `New invoice created!`,
    duration: 2000,
    gravity: 'top', // or 'top'
    position: 'center', // or 'right', 'center'
    style: {
      background: 'rgb(61, 183, 138)',
      borderRadius: '10px',
    },
    stopOnFocus: true,
  }).showToast();
  if (isUpdated)
    Toastify({
      text: `Invoice Updated!`,
      duration: 2000,
      gravity: 'top', // or 'top'
      position: 'center', // or 'right', 'center'
      style: {
        background: 'rgb(61, 183, 138)',
        borderRadius: '10px',
      },
      stopOnFocus: true,
    }).showToast();
  localStorage.removeItem('isInvoiceSaved');
  localStorage.removeItem('isInvoiceUpdated');
}

const excelInp = document.querySelector('.excel-file-inp');
excelIcon.addEventListener('click', function() {
  excelInp.click();
})