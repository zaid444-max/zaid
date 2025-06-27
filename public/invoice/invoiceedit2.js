const targettedInvoiceId = parseInt(localStorage.getItem('targettedInvoiceId'));
const squareContainer = document.querySelector('.square-item-container-div');
const tableTbody = document.querySelector('.pos-invoice-table').getElementsByTagName('tbody')[0];
const totalSpan = document.querySelector('.total-span');
const discountSpan = document.querySelector('.discount-span');
const netTotal = document.querySelector('.net-total-span');
const totalQuantitySpan = document.querySelector('.total-quantity-span');
const totalProfitSpan = document.querySelector('.total-profit-span');
const invoiceCheckbox = document.getElementById('invoice-checkbox');
const loanCheckbox = document.getElementById('loan-checkbox');
const customDropdwon = document.querySelector('.customDropdwon');
const deliveryCustomDropdwon = document.querySelector('.delivery-customDropdwon');
const customerInp = document.querySelector('.customer-inp');
const deliveryInp = document.querySelector('.delivery-inp');
const inputContainerDiv = document.querySelector('.input-container-div');
const deliveryInputContainerDiv = document.querySelector('.delivery-input-container-div');
const currentInvoiceArrey = [];
const customerListArray = [];
const categoryListArray = [];
const deliveryListArray = [];
const squareContainerArray = [];
const itemList = [];
const categoryInputContainerDiv = document.querySelector('.category-input-container-div');
const categoryCustomDropdwon = document.querySelector('.category-customDropdwon');
const categoryInp = document.querySelector('.category-inp');
const netTotalSpan = document.querySelector('.net-total-span');
const clearInpIcon = document.querySelector('.fa-times-circle');
const removeIcon = document.querySelector('.customerRemoveIcon');
const priceSelect = document.querySelector('.price-select');
const stockInvsArray = [];
const customerLoans = [];
const printIcon = document.querySelector('.fa-print');
const noteInp = document.querySelector('.note-inp');
const searchItemInp = document.querySelector('.search-item-inp');
searchItemInp.focus();
const pageInp = document.querySelector('.page-inp');
pageInp.value = 50;
let isPendingDone = false;
const discriptionModels = document.querySelector('.discriptionModels');
const languageSelect = document.querySelector('.langause-select');
const workerNamesDiv = document.querySelector('.worker-names-div');

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
window.location.reload();
  }
});

const digitToLetter = {
  '0': 'Z',
  '1': 'O',
  '2': 'T',
  '3': 'E',
  '4': 'F',
  '5': 'P',
  '6': 'S',
  '7': 'H',
  '8': 'A',
  '9': 'N'
};

async function fetchCurrentInvoice() {
  const response = await fetch(`${htt}://${serverIP}${port}/posinvoices/${targettedInvoiceId}`);
  const currentInvoice = await response.json();
  if (currentInvoice.invStatus === 'Paid') {
    loanCheckbox.disabled = true;
    customerInp.disabled = true;
    customerInp.style.color = 'gray';
    deliveryInp.disabled = true;
    deliveryInp.style.color = 'gray';
    removeIcon.style.pointerEvents = 'none';
    removeIcon.style.color = 'gray';
    deliveryRemoveIcon.style.pointerEvents = 'none';
    deliveryRemoveIcon.style.color = 'gray';
    priceSelect.disabled = true;
  }
  return currentInvoice;
}

async function fetchCustomerInvoice() {
  const exists = customerLoans.some(loan => String(loan.invoiceNum).trim() === String(targettedInvoiceId).trim());
  if (exists) {
    loanCheckbox.checked = true;
  }
}

let lastInvoiceDiscount;
async function setCustomerInpId() {
  const response = await fetch(`${htt}://${serverIP}${port}/posinvoices/${targettedInvoiceId}`);
  const targetInvoice = await response.json();
  await fetchAllItems();
  for(const item of targetInvoice.items) {
    const newTr = document.createElement('tr');
    newTr.className = 'newRow-tr';
    newTr.innerHTML = item;
    const itemId = Number(newTr.querySelector('.id-td .id-span').innerHTML);
    const targetItem = itemList.find(item => item.id === itemId);
    newTr.querySelector('.name-td .item-name-span').innerHTML = `
    ${targetItem.brand_name + ' ' + targetItem.model_name + ' ' + targetItem.category_name + ' ' + targetItem.quality_name}
    `
    tableTbody.appendChild(newTr);
    currentInvoiceArrey.push(newTr);
    totalSpan.innerHTML = targetInvoice.total;
    discountSpan.innerHTML = Number(targetInvoice.discount) !== 0 ? ('-' + Number(targetInvoice.discount)) : 0;
    netTotal.innerHTML = targetInvoice.netTotal;
    totalQuantitySpan.innerHTML = targetInvoice.totalQuantity;
    
    lastInvoiceDiscount = targetInvoice.discount || 0;

    if (targetInvoice.invStatus === 'Canceled') {
      deleteRow();
      setAddeventlistenner();
    }
  };
  updateTotal()
  calculateProfit()
  customerInp.setAttribute('data-id', targetInvoice.customerId);
  deliveryInp.setAttribute('data-id', targetInvoice.deliveryId);
  
  let total = 0;
  const customerLoansArray = customerLoans.filter(loan => loan.customer_id === targetInvoice.customerId);
  customerLoansArray.forEach(loan => {total += Number(loan.amount)});
  customerInp.value = targetInvoice.customer_name + ` (${total.toLocaleString()})`;
  deliveryInp.value = targetInvoice.delivery_name;
  noteInp.value = targetInvoice.note;
  searchTable();
}

let totalBuyAmount = 0;
let totalProfit = 0;
async function calculateProfit() {
  for(const tr of currentInvoiceArrey) {
    const itemId = parseInt(tr.querySelector('.id-td').querySelector('.id-span').innerHTML);
    if (tr.querySelector('.target-inv-td').innerHTML === '') continue;
    const targetInv = tr.querySelector('.target-inv-td').innerHTML.match(/\d+-\d+/g).map(pair => pair.split("-").map(Number));
    for(const item of targetInv) {
      const itemQuantity = item[0];
      const targetInvId = item[1];
      const response = await fetch(`${htt}://${serverIP}${port}/stockentinvs/${targetInvId}`);
      const targetInv = await response.json();
      targetInv.items.forEach(item => {
        if (item.itemId === itemId) {
          const itemTotalBuyPrice = item.buyPrice * itemQuantity;
          totalBuyAmount += itemTotalBuyPrice;
          totalProfit = parseFloat(netTotal.innerHTML.replace(/,/g, '')) - totalBuyAmount;
          const formattedProfit = Number(totalProfit).toLocaleString().replace(/\d/g, d => digitToLetter[d]);
          totalProfitSpan.innerHTML = formattedProfit;
        };
      });
    };
  };
};

// Cheking the invoice status
const tableFoot = document.querySelector('.table-foot');
async function CheckInvoiceStatus() {
  await fetchCustomers();
  await fetchDeliveries();
  await fetchCurrentInvoice()
  const response = await fetch(`${htt}://${serverIP}${port}/posinvoices/${targettedInvoiceId}`);
  const targetInvoice = await response.json();
  await fetchCustomerInvoice();
  const loanCheckbox = document.getElementById('loan-checkbox');
  if (targetInvoice.invStatus === 'Paid') {
    const payButtonTd = document.querySelector('.pay-button-td')
    document.querySelector('.pay-butt').style.display = 'none';
    document.querySelector('.discount-butt').style.display = 'none';
    document.querySelector('.discount-butt-td').style.display = 'none';
    const newCancelButt = document.createElement('button');
    newCancelButt.innerHTML = 'Cancel';
    newCancelButt.className = 'new-cancel-butt'
    payButtonTd.colSpan = 3;
    payButtonTd.appendChild(newCancelButt);
    payButtonTd.style.paddingRight = '10px';
    
    newCancelButt.addEventListener('click', async() => {
      try {
        const response = await fetch(`${htt}://${serverIP}${port}/posinvoices/${targettedInvoiceId}`);
        const targetInv = await response.json();
        if (targetInv.invStatus !== 'Paid') 
          return Toastify({
            text: `This invoice is already canceled or deleted!`,
            duration: 3000,
            gravity: 'top', // or 'top'
            position: 'center', // or 'right', 'center'
            style: {
              background: 'rgb(154, 59, 59)',
              borderRadius: '10px',
            },
            stopOnFocus: true,
          }).showToast();
      } catch {
        console.log('not Fount')
        return Toastify({
          text: `This invoice is already canceled or deleted!`,
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
      newCancelButt.disabled = true;
      newCancelButt.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      await fetch(`${htt}://${serverIP}${port}/posinvoices/${targettedInvoiceId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          invStatus: 'Canceled'
        })
      });

      for(const tr of currentInvoiceArrey) {
        const itemId = parseInt(tr.querySelector('.id-td').querySelector('.id-span').innerHTML);
        const itemQuantity = parseInt(tr.querySelector('.quantity-td').innerHTML);
        const response = await fetch(`${htt}://${serverIP}${port}/items/${itemId}`);
        const targetItem = await response.json();
        targetItem.quantity = parseInt(targetItem.quantity) + itemQuantity;
        await fetch(`${htt}://${serverIP}${port}/items/${itemId}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            quantity: targetItem.quantity
          })
        });
        if (tr.querySelector('.target-inv-td').innerHTML === '') continue;
        const targetInvTdHTMLList = tr.querySelector('.target-inv-td').innerHTML.match(/\d+-\d+/g).map(pair => pair.split("-").map(Number));
        for(const item of targetInvTdHTMLList) {
          const targetInv = item[1];
          const targetInvQuantity = item[0];
          const response = await fetch(`${htt}://${serverIP}${port}/stockentinvs/${targetInv}`);
          const targetStockentryInv = await response.json();
          if (!targetStockentryInv) {return};
          for(const item of targetStockentryInv.items) {
            if (item.itemId === itemId) {
              item.lastQuantity += targetInvQuantity;
              await fetch(`${htt}://${serverIP}${port}/stockentinvs/${targetInv}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                  items: JSON.stringify(targetStockentryInv.items)
                })
              });
            };
          };
        };
       }
  
      newCancelButt.style.display = 'none';
      document.querySelector('.pay-butt').style.display = 'inline-block';
      payButtonTd.colSpan = 1;
      document.querySelector('.discount-butt-td').style.display = '';
      document.querySelector('.discount-butt').style.display = 'inline-block';
      if (!loanCheckbox.checked) {
        document.querySelector('.pay-butt').innerHTML = 'Submit';
      } else {
        document.querySelector('.pay-butt').innerHTML = 'Submit Loan';
        payButt.style.backgroundColor = 'rgb(222, 220, 223)';
        payButt.style.color = 'rgb(139, 3, 3)';
      }
      payButtonTd.style.paddingRight = '0px';
      const exists = customerLoans.some(loan => String(loan.invoiceNum).trim() === String(targettedInvoiceId).trim());
      if (exists) {
        const response = await fetch(`${htt}://${serverIP}${port}/oneloan/${targettedInvoiceId}`);
        const loan = await response.json();
        const updatedLoan = Number(netTotal.innerHTML.replace(/,/g, '')) - Number(loan.amount);
        await fetch(`${htt}://${serverIP}${port}/loans/${loan.id}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            amount: updatedLoan
          })
        });
      }
      location.reload(true);
    });
  } else if (targetInvoice.invStatus === "Canceled") {
    if (!loanCheckbox.checked) {
      document.querySelector('.pay-butt').innerHTML = 'Submit';
    } else {
      document.querySelector('.pay-butt').innerHTML = 'Submit Loan';
      payButt.style.backgroundColor = 'rgb(222, 220, 223)';
      payButt.style.color = 'rgb(139, 3, 3)';
    }
  } else if (targetInvoice.invStatus === "Canceled2") {
    document.querySelector('.pay-butt').style.display = 'none';
    document.querySelector('.discount-butt').style.display = 'none';
  }
  priceSelect.value =  targetInvoice.priceLevel;
}

CheckInvoiceStatus();

// Square divs here
let latestFetchId = 0;  
async function fetchItems() {
  const thisFetchId = ++latestFetchId; // Increment global fetch ID
  await addPendingStockQnt();
  const scrollPosition = squareContainer.scrollTop;
  const page = pageInp.value === '' ? 50 : Number(pageInp.value);
  squareContainerArray.length = 0;
  squareContainer.innerHTML = '';
  const search = searchItemInp.value;
  const categoryInpVal = categoryInp.value.replace(/\+/g, 'plus');
  const response = await fetch(`${htt}://${serverIP}${port}/itemsFilter?limit=${page}&search=${search}&categoryDivVal=${categoryInpVal}`);
  const items = await response.json();
  if (thisFetchId !== latestFetchId) return;
  for(const item of items) {
    let totalPendQnt = 0;
    const id = item.id;
    const mappedArrey = stockInvsArray.map(stockInv => {
      return stockInv.items.filter(item => item.itemId === id)[0]
    }).filter(item => item !== undefined)
    mappedArrey.forEach(item => {
      totalPendQnt += item.quantity
    })
    if (item.disable === 'checked') continue;
    const newDiv = document.createElement('div');
    newDiv.className = 'square-item-div'
    newDiv.innerHTML = `
    <span class="brand-span">${item.brand_name}</span>
    <span class="model-span">${item.model_name}</span>
    <span class="quality-span">${item.quality_name}</span>
    <span class="category-span">${item.category_name}</span>
    <span class="quantity-span">${item.quantity}${totalPendQnt !== 0 ? (' + ' + totalPendQnt) : ''}</span>
    <span class="price-one-span" onclick="showPrice(event, 'div')">${formatNumber(parseFloat(item.priceOne))} IQD</span>
    <span class="id-span">${item.id}</span>
    <span class="box-id-span" style="display: none;">${item.boxId === null ? '' : item.boxId}</span>
    <span class="sku-span" style="display: none;">${item.SKU === null ? '' : item.SKU}</span>
    <span class="discription-span" style="display: none;">${item.discription || ''}</span>
    <span class="boxId-span">${item.boxId === null ? '' : item.boxId.split(' ')[0]}</span>
    `;
    /* See I hided the display of item.itemId */
    squareContainerArray.push(newDiv);
    squareContainer.appendChild(newDiv);
    newDiv.querySelector('.boxId-span').style.color = item.boxId ? `${item.boxId.split(' ')[1]}` : '';
    newDiv.style.backgroundColor = `${item.ball}`;
    const boxIdSpan = newDiv.querySelector('.boxId-span');
    boxIdSpan.style.backgroundColor = boxIdSpan.innerHTML.trim() === '' ? 'transparent' : '';
    if (newDiv.querySelector('.quantity-span').innerHTML.split('+')[0].trim() === '0') {
      newDiv.querySelector('.quantity-span').style.backgroundColor = 'rgb(211, 39, 39)';
      newDiv.querySelector('.quantity-span').style.color = 'white';
    };
  }
  const currentInvResponse = await fetch(`${htt}://${serverIP}${port}/posinvoices/${targettedInvoiceId}`);
  const targetInvoice = await currentInvResponse.json();
  if (targetInvoice.invStatus === 'Canceled') { // Because we do not want it when the invoice is not canceled.
    const squareItems = document.querySelectorAll('.square-item-div');
    squareItems.forEach(squareItem => {
      squareItem.addEventListener('click', async (e) => {
        invoiceCheckbox.checked ? '' : searchItemInp.select();
        if (e.target.matches('.price-one-span')) return
        const targettedItemIdHTML = e.target.closest('div').querySelector('.id-span').innerHTML;
        const targettedBoxIdHTML = e.target.closest('div').querySelector('.box-id-span').innerHTML;
        const targettedSkuHTML = e.target.closest('div').querySelector('.sku-span').innerHTML;
        const brandSpanHTML = e.target.closest('div').querySelector('.brand-span').innerHTML;
        const modelSpanHTML = e.target.closest('div').querySelector('.model-span').innerHTML;
        const categorySpanHTML = e.target.closest('div').querySelector('.category-span').innerHTML;
        const qualitySpanHTML = e.target.closest('div').querySelector('.quality-span').innerHTML;
        let quantitySpanHTML = 1;
        const priceOneSpanHTML = e.target.closest('div').querySelector('.price-one-span').innerHTML;
        const squareTargetItemQuantity = parseInt(e.target.closest('div').querySelector('.quantity-span').innerHTML);
        const respone = await fetch(`${htt}://${serverIP}${port}/items/${parseInt(targettedItemIdHTML)}`)
        const tableTargetItem = await respone.json();
        if (tableTargetItem.quantity <= 0) {
          Toastify({
            text: `This item is out of stock`,
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
        
        let itemFound = false;
        currentInvoiceArrey.forEach(item => {
          const idTdHTML = item.querySelector('td.id-td').querySelector('.id-span').innerHTML;
          let totalTd = item.querySelector('td.total-td');
          totalTdHTML = parseFloat(totalTd.innerHTML)
          let priceTd = item.querySelector('td.price-td');
          priceTdHTML = parseFloat(priceTd.innerHTML)
          let quantityTd = item.querySelector('td.quantity-td');
          let quantityTdHTML = parseInt(quantityTd.innerHTML);
          
          if (targettedItemIdHTML === idTdHTML) {
            if (squareTargetItemQuantity === quantityTdHTML) {
              Toastify({
                text: `This item is out of stock`,
                duration: 3000,
                gravity: 'top', // or 'top'
                position: 'center', // or 'right', 'center'
                style: {
                  background: 'rgb(154, 59, 59)',
                  borderRadius: '10px',
                },
                stopOnFocus: true,
              }).showToast();
              itemFound = true;return
            }
            quantityTdHTML += 1;
            quantityTd.innerHTML = quantityTdHTML;
            totalTdHTML = quantityTdHTML * priceTdHTML;
            totalTd.innerHTML = totalTdHTML
            renderInvoiceTable();
            itemFound = true;
          }
        }) 
        if (!itemFound) {
          createNewRow(targettedItemIdHTML, brandSpanHTML, modelSpanHTML, categorySpanHTML, qualitySpanHTML, quantitySpanHTML, priceOneSpanHTML, targettedBoxIdHTML, targettedSkuHTML);
        }
      })
    });
  }
  await fetchAllItems();
  priceSelect.dispatchEvent(new Event('change'));
  isCategoryDropdown = false;
  squareContainer.scrollTop = scrollPosition;
  isInitialPageEntering = false;
}

fetchItems();

let isAllItemFetched = false;
async function fetchAllItems() {
  if (!isAllItemFetched) {
    const response = await fetch(`${htt}://${serverIP}${port}/items`);
    const items = await response.json();
    for(const item of items) itemList.push(item);
  }
  isAllItemFetched = true;
}

pageInp.addEventListener('keydown', async function(e) {
  if (e.key === 'Enter') await fetchItems();
})

async function addPendingStockQnt() {
  if (isPendingDone) return;
  const response = await fetch(`${htt}://${serverIP}${port}/stockentinvs`);
  const stockInvs = await response.json();
  stockInvs.forEach(invoice => {
    if (invoice.invStatus !== 'Pending') return;
    stockInvsArray.push(invoice);
  })
  isPendingDone = true;
}

function showPrice(event, position) {
  const itemId = position === 'row' ? Number(event.target.closest('tr').querySelector('.id-td').querySelector('.id-span').innerHTML) : position === 'div' ? Number(event.target.closest('.square-item-div').querySelector('.id-span').innerHTML) : '';
  const targetItem = itemList.find(item => item.id === itemId);
  const buyPriceNum = Number(targetItem.buyPrice);
  const buyPrice = buyPriceNum.toString();

  const itemName = position === 'row' ? event.target.innerText : position === 'div' ?
  (event.target.closest('.square-item-div').querySelector('.brand-span').innerHTML + ' ' +
  event.target.closest('.square-item-div').querySelector('.model-span').innerHTML + ' ' +
  event.target.closest('.square-item-div').querySelector('.category-span').innerHTML + ' ' +
  event.target.closest('.square-item-div').querySelector('.quality-span').innerHTML) : ''

  // Replace numbers with corresponding letters using chained replace()
  const transformedPrice = buyPrice
  .replace(/1/g, 'O')
  .replace(/2/g, 'T')
  .replace(/3/g, 'E')
  .replace(/4/g, 'F')
  .replace(/5/g, 'P')
  .replace(/6/g, 'S')
  .replace(/7/g, 'H')
  .replace(/8/g, 'A')
  .replace(/9/g, 'N')
  .replace(/0/g, 'Z');

  // Show a toast notification
  Toastify({
    text: `${itemName}: ${transformedPrice} / ${event?.target?.closest('tr')?.querySelector('.box-id-td')?.innerHTML}`,
    duration: 3000,
    gravity: 'bottom', // or 'top'
    position: 'left', // or 'right', 'center'
    style: {
      background: 'rgb(53, 122, 104)',
      borderRadius: '10px',
    },
    stopOnFocus: true,
  }).showToast();
}

function createNewRow(targettedItemIdHTML, brandSpanHTML, modelSpanHTML, categorySpanHTML, qualitySpanHTML, quantitySpanHTML, priceOneSpanHTML, targettedBoxIdHTML, targettedSkuHTML) {
  const newRow = document.createElement('tr');
  newRow.className = 'newRow-tr';

  const idTd = document.createElement('td');
  idTd.className = 'id-td';
  idTd.innerHTML = `<span class="id-span">${targettedItemIdHTML}</span>`;
  newRow.appendChild(idTd);
  const BoxIdTd = document.createElement('td');
  BoxIdTd.className = 'box-id-td';
  BoxIdTd.innerHTML = targettedBoxIdHTML;
  newRow.appendChild(BoxIdTd);
  const nameTd = document.createElement('td');
  nameTd.innerHTML = `
  <span class="item-name-span">${brandSpanHTML} ${modelSpanHTML} ${categorySpanHTML} ${qualitySpanHTML}</span>
  <span class="item-inf-span">${targettedBoxIdHTML === null ? '' : targettedBoxIdHTML} ${targettedSkuHTML === null ? '' : targettedSkuHTML}</span>`
  nameTd.className = 'name-td';
  nameTd.setAttribute('onclick', 'showPrice(event, "row")')
  newRow.appendChild(nameTd);
  const quantityTd = document.createElement('td');
  quantityTd.className = 'quantity-td';
  quantityTd.innerHTML = parseInt(quantitySpanHTML);
  newRow.appendChild(quantityTd);
  const priceTd = document.createElement('td');
  priceTd.className = 'price-td';
  priceTd.innerHTML= priceOneSpanHTML;
  newRow.appendChild(priceTd);
  const targetInvTd = document.createElement('td');
  targetInvTd.className = 'target-inv-td';
  targetInvTd.innerHTML= '';
  newRow.appendChild(targetInvTd);
  const totalTd = document.createElement('td');
  totalTd.className = 'total-td';
  totalTd.innerHTML = quantityTd.innerHTML * parseFloat(priceTd.innerHTML);
  newRow.appendChild(totalTd);
  const deleteTd = document.createElement('td');
  deleteTd.innerHTML = `<i class="fas fa-trash delete-row-icon"></i>`;
  newRow.appendChild(deleteTd);

  currentInvoiceArrey.push(newRow);
  renderInvoiceTable()
};

function renderInvoiceTable() {
    tableTbody.innerHTML = '';
    [...currentInvoiceArrey].reverse().forEach(item => {
    tableTbody.appendChild(item);
  });
  deleteRow();

  tableTbody.querySelectorAll('.quantity-td').forEach(quantityTd => {
    quantityTd.addEventListener('click', (e) => {
      const targetTd = e.target;
      const priceTd = targetTd.closest('tr').querySelector('.price-td');
      const totalTd = targetTd.closest('tr').querySelector('.total-td');

      if (targetTd.querySelector('input')) {
        return
      }
      
      const oldValue = targetTd.innerHTML;
      const newInp = document.createElement('input');
      newInp.type = 'number';
      newInp.value = oldValue;
      newInp.className = 'quantity-inp';
      targetTd.innerHTML = '';
      targetTd.appendChild(newInp);
      newInp.focus();
      newInp.select();

      newInp.addEventListener('blur', async () => {
        const itemId = targetTd.closest('tr').querySelector('.id-td').querySelector('.id-span').innerHTML;
        const response = await fetch(`${htt}://${serverIP}${port}/items/${itemId}`);
        const targetItem = await response.json();
        if (parseInt(newInp.value) > targetItem.quantity || parseInt(newInp.value) === 0) {
          Toastify({
            text: `This is an invalid quantity`,
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
        }
        
        targetTd.innerHTML = newInp.value.replace(/[^0-9]/g, '') || 1;
        totalTd.innerHTML = parseInt(targetTd.innerHTML) * priceTd.innerHTML.split(' ')[0].replace(/,/g, '');
        const total = priceTd.innerHTML.split(' ')[0].replace(/,/g, '') * parseFloat(targetTd.innerHTML);
        totalTd.innerHTML = total.toLocaleString();
        updateTotal();
        searchItemInp.select();
      });

      newInp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          newInp.blur();
        } else if (e.key === '-') e.preventDefault();
        newInp.addEventListener('keydown', (e) => {
          if (['-', 'ArrowUp', 'ArrowDown', 'e', 'E'].includes(e.key)) {e.preventDefault()};
        })
      })
    })
  });

  tableTbody.querySelectorAll('.price-td').forEach((priceTd) => {
    priceTd.addEventListener('click', (e) => {
      const targetTd = e.target;
      const quantityTd = targetTd.closest('tr').querySelector('.quantity-td');
      const totalTd = targetTd.closest('tr').querySelector('.total-td');
      
      if (targetTd.querySelector('input')) {
        return
      }
      const oldValue = targetTd.innerHTML.split(' ')[0].replace(/,/g, '');
      const newInp = document.createElement('input');
      newInp.type = 'number';
      newInp.value = oldValue;
      newInp.className = 'price-inp';
      targetTd.innerHTML = '';
      targetTd.appendChild(newInp);
      newInp.focus();
      newInp.select();
      
      newInp.addEventListener('blur', () => {
        targetTd.innerHTML = Number(newInp.value.trim()).toLocaleString() + ' IQD';
        const total = parseFloat(quantityTd.innerHTML) * Number(targetTd.innerHTML.split(' ')[0].replace(/,/g, ''));
        totalTd.innerHTML = total.toLocaleString();
        updateTotal();
        searchItemInp.select();
      });

      newInp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          newInp.blur();
        }
        if (['-', 'ArrowUp', 'ArrowDown', 'e', 'E'].includes(e.key)) {
          e.preventDefault()
        }
      })
    })
  })

  updateTotal();
};

function updateTotal() {
  let total = 0;
  let netTotal = 0;
  let totalCurrentProfit = 0;
  const totalSpan = document.querySelector('.total-span');
  let netTotalSpan = document.querySelector('.net-total-span');
  const discountSpan = document.querySelector('.discount-span');
  const discountInp = document.querySelector('.discount-inp');
  const discountInpVal = lastInvoiceDiscount || 0;

  const totalQuantitySpan = document.querySelector('.total-quantity-span');
  let totalQuantitySpanHTML = parseInt(totalQuantitySpan.innerHTML);
  totalQuantitySpanHTML = 0;
  const newCancelButt = document.querySelector('.new-cancel-butt');

  if (currentInvoiceArrey.length !== 0) {
    currentInvoiceArrey.forEach(item => {
      const totalTd = item.querySelector('tr td.total-td');
      total += parseFloat(totalTd.innerHTML.replace(/,/g, ''));
      totalSpan.innerHTML = total.toLocaleString();

      totalQuantitySpanHTML += parseInt(item.querySelector('tr td.quantity-td').innerHTML);
      totalQuantitySpan.innerHTML = totalQuantitySpanHTML;
      if (!newCancelButt) {
        const itemId = Number(item.querySelector('.id-td').querySelector('.id-span').innerHTML);
        const targetItem = itemList.find(item => parseInt(item.id) === parseInt(itemId));
        totalCurrentProfit += (Number(targetItem.buyPrice) * Number(item.querySelector('.quantity-td').innerHTML.replace(/,/g, '')))
      }
    })
    netTotal = total - discountInpVal;
    netTotalSpan.innerHTML = netTotal.toLocaleString();

    if (!newCancelButt) {
      totalProfitSpan.innerHTML =  Number(netTotal - totalCurrentProfit).toLocaleString()
      .replace(/0/g, 'Z')
      .replace(/1/g, 'O')
      .replace(/2/g, 'T')
      .replace(/3/g, 'E')
      .replace(/4/g, 'F')
      .replace(/5/g, 'P')
      .replace(/6/g, 'S')
      .replace(/7/g, 'H')
      .replace(/8/g, 'A')
      .replace(/9/g, 'N');
    }
  } else if (currentInvoiceArrey.length === 0) {
    totalSpan.innerHTML = 0;
    discountSpan.innerHTML = 0;
    lastInvoiceDiscount = 0;
    netTotalSpan.innerHTML = 0;
    discountInp.value = 0;
    totalProfitSpan.innerHTML = '';
  }
};

const discountButt = document.querySelector('.discount-butt');
const modalContainerDiv = document.querySelector('.modal-container-div');
const modalContainerContentDiv = document.querySelector('.modal-container-content-div');
discountButt.addEventListener('click', () => {
  const discountInp = modalContainerContentDiv.querySelector('.discount-inp');
  discountInp.value = Number(lastInvoiceDiscount);
  modalContainerDiv.classList.add('show');
  setTimeout(() => {
    discountInp.focus();
    discountInp.select();
  }, 50);

  const applyDiscountButt = modalContainerContentDiv.querySelector('.apply-discount-butt');

  function applyDiscount() {
    const discountInpVal = parseFloat(modalContainerContentDiv.querySelector('.discount-inp').value);
    lastInvoiceDiscount = discountInpVal.toString().replace(/,/g, '');
    let totalSpan = document.querySelector('.total-span');
    const discountSpan = document.querySelector('.discount-span');
    const netTotal = document.querySelector('.net-total-span');
    if (currentInvoiceArrey.length !== 0 && !isNaN(discountInpVal)) {
      netTotal.innerHTML = Number(totalSpan.innerHTML.replace(/,/g, '')) - parseFloat(discountInpVal);
      discountSpan.innerHTML = '-' + parseFloat(discountInpVal);
      modalContainerDiv.classList.remove('show');

      if (discountInpVal === 0) {
        discountSpan.innerHTML = 0;
      }
     } else {
      modalContainerDiv.classList.remove('show');
      discountInp.value = 0;
    }
    updateTotal();
  };

  applyDiscountButt.addEventListener('click', applyDiscount);

  discountInp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      applyDiscount()
    }
  })
  modalContainerContentDiv.querySelector('.close-sign-span').addEventListener('click', () => {
    modalContainerDiv.classList.remove('show');
      discountInp.value = 0;
  });

  modalContainerDiv.addEventListener('click', (e) => {
    console.log(e.target.className)
    if (e.target.className === 'modal-container-div show') {
      modalContainerDiv.classList.remove('show');
        discountInp.value = 0;
    }
  })
});

const payButt = document.querySelector('.pay-butt');
payButt.addEventListener('click', async () => { 
  if (inputContainerDiv.style.display === '') {
    Toastify({
      text: `Please Select a customer for a loan`,
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
  const totalQuantitySpan = document.querySelector('.total-quantity-span');
  let totalQuantitySpanHTML = parseInt(totalQuantitySpan.innerHTML);
  if (currentInvoiceArrey.length !== 0) {
    for (const tr of currentInvoiceArrey) {
      const itemId = parseInt(tr.querySelector('.id-td').querySelector('.id-span').innerHTML);
      const itemQuantity = parseInt(tr.querySelector('.quantity-td').innerHTML);
      const response = await fetch(`${htt}://${serverIP}${port}/items/${itemId}`);
      const targetItem = await response.json();
      if (targetItem.quantity < itemQuantity) {
        const loanCheckbox = document.getElementById('loan-checkbox');
        payButt.innerHTML = !loanCheckbox.checked ? 'Submit' : 'Submit Loan';payButt.disabled = true;
        Toastify({
          text: `${tr.querySelector('.name-td').querySelector('.item-name-span').innerHTML} is not enough left`,
          duration: 3000,
          gravity: 'top', // or 'top'
          position: 'center', // or 'right', 'center'
          style: {
            background: 'rgb(154, 59, 59)',
            borderRadius: '10px',
          },
          stopOnFocus: true,
        }).showToast();
        payButt.disabled = false;
        return;
      }
      if (tr.querySelector('.quantity-td input') || tr.querySelector('.price-td input')) {
        Toastify({
          text: `Please check ${tr.querySelector('.name-td').querySelector('.item-name-span').innerHTML}`,
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
      }
    }
    payButt.disabled = true;
    payButt.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    firstLoop: for (const tr of currentInvoiceArrey) {
      const itemId = parseInt(tr.querySelector('.id-td').querySelector('.id-span').innerHTML);
      const itemQuantity = parseInt(tr.querySelector('.quantity-td').innerHTML);
      const response = await fetch(`${htt}://${serverIP}${port}/items/${itemId}`);
      const targetItem = await response.json();
      targetItem.quantity = parseInt(targetItem.quantity) - itemQuantity;
      await fetch(`${htt}://${serverIP}${port}/items/${itemId}`, {
        method:'PUT',
        headers:{'Content-Type': 'application/json'},
        body: JSON.stringify({
          quantity: targetItem.quantity
        })
      })
      const targetInvTd =  tr.querySelector('.target-inv-td');
      targetInvTd.innerHTML = '';
      const response2 = await fetch(`${htt}://${serverIP}${port}/stockentinvs`);
      const StockentryInvoices = await response2.json();
      
      let remainingQuantity = itemQuantity;
      secondLoop: for (const invoice of StockentryInvoices) {
        if (invoice.invStatus === 'Pending') {continue};
        thirdLoop: for (const item of invoice.items) {
          if (item.itemId === itemId && item.lastQuantity !== 0) {
            if (item.lastQuantity >= remainingQuantity) {
              targetInvTd.innerHTML += '(' + remainingQuantity + '-' + invoice.id + ')';
              item.lastQuantity -=  remainingQuantity;
              await fetch(`${htt}://${serverIP}${port}/stockentinvs/${invoice.id}`, {
                method:'PUT',
                headers:{'Content-Type': 'application/json'},
                body: JSON.stringify({
                  items: JSON.stringify(invoice.items)
                })
              });
              remainingQuantity = 0;
            } else {
              remainingQuantity -= item.lastQuantity;
              targetInvTd.innerHTML += '(' + item.lastQuantity + '-' + invoice.id + ')';
              item.lastQuantity = 0;
              await fetch(`${htt}://${serverIP}${port}/stockentinvs/${invoice.id}`, {
                method:'PUT',
                headers:{'Content-Type': 'application/json'},
                body: JSON.stringify({
                  items: JSON.stringify(invoice.items)
                })
              });
          } 
          }
          if (remainingQuantity === 0) {
            break secondLoop;
            break thirdLoop;
          };
        }
      }
    };
    const tableArreyConverting = Array.from(document.querySelectorAll('tbody tr')).map(tr => tr.innerHTML);
    const itemIds = Array.from(document.querySelectorAll('tbody tr')).map(tr => tr.querySelector('.id-td .id-span').innerHTML);
    let totalSpan = document.querySelector('.total-span');
    const discountSpan = document.querySelector('.discount-span');
    let netTotalSpan = document.querySelector('.net-total-span');
    const response2 = await fetch(`${htt}://${serverIP}${port}/posinvoices/${targettedInvoiceId}`);
    const posInvoice = await response2.json();

    await fetch(`${htt}://${serverIP}${port}/posinvoices/${targettedInvoiceId}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        invStatus: 'Canceled2'
      })
    });
    const customeResponse = await fetch(`${htt}://${serverIP}${port}/customers/${customerInp.getAttribute('data-id')}`);
    const customer = await customeResponse.json();

    const posInvoiceData = {
      newDate: posInvoice.newDate,
      items: JSON.stringify(tableArreyConverting),
      customerId: customerInp.getAttribute('data-id'),
      delFee: Number(customer.delFee),
      deliveryId: deliveryInp.getAttribute('data-id'),
      workerId: setWorker() || 1,
      orders: posInvoice.orders,
      total: parseFloat(totalSpan.innerHTML.replace(/,/g, '')),
      discount: parseFloat(discountSpan.innerHTML.replace(/,/g, '').replace(/-/g, '')),
      netTotal: parseFloat(netTotalSpan.innerHTML.replace(/,/g, '')),
      invStatus: 'Paid',
      totalQuantity: totalQuantitySpanHTML,
      note: noteInp.value.trim(),
      priceLevel: priceSelect.value,
      computerName: localStorage.getItem('computerVal') || '',
      itemIds: JSON.stringify(itemIds),
    };
    const respone = await fetch(`${htt}://${serverIP}${port}/posinvoices`, {
      method: 'POST',
      headers:{'Content-Type': 'application/json'},
      body: JSON.stringify(posInvoiceData)
    });
    const addedInvoice = await respone.json();

    const customerId = customerInp.getAttribute('data-id');
    const invoiceCheckbox = document.getElementById('invoice-checkbox');
    if (invoiceCheckbox.checked) {
      await printInvoice(addedInvoice.insertId, 'newInvoice');
    }
    if (loanCheckbox.checked) {
      const response2 = await fetch(`${htt}://${serverIP}${port}/loans/${customerInp.getAttribute('data-id')}`);
      const customerLoans = await response2.json();
      if (customerLoans.some(loan => loan.invoiceNum === targettedInvoiceId)) {
        const targetLoan = customerLoans.find(loan => loan.invoiceNum === targettedInvoiceId);
        await fetch(`${htt}://${serverIP}${port}/loans/${targetLoan.id}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            amount: Number(targetLoan.amount) + parseFloat(netTotalSpan.innerHTML.replace(/,/g, ''))
          })
        });
        await fetch(`${htt}://${serverIP}${port}/loans/${targetLoan.id}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            invoiceNum: addedInvoice.insertId
          })
        });
      } else {
        await fetch(`${htt}://${serverIP}${port}/loans`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            amount: parseFloat(netTotalSpan.innerHTML.replace(/,/g, '')),
            invoiceNum: addedInvoice.insertId,
            note: '',
            customer_id: customerId
          })
        })
      }
      
      localStorage.setItem('showLoanToast', 'true')
    }
    document.body.classList.add('animate-out');
    window.history.back();
  } else {
    Toastify({
      text: `Please select an item to pay`,
      duration: 3000,
      gravity: 'top', // or 'top'
      position: 'center', // or 'right', 'center'
      style: {
        background: 'rgb(154, 59, 59)',
        borderRadius: '10px',
      },
      stopOnFocus: true,
    }).showToast();
  } return;
});

async function printInvoice(invoiceId, invoiceType) {
  if (isHeld && invoiceType !== 'iPower') return;
  // Load jsPDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Add Kurdish font
  doc.addFileToVFS("NotoNaskhArabic-Regular.ttf", font);
  doc.addFont("NotoNaskhArabic-Regular.ttf", "NotoNaskh", "normal");
  doc.setFont("NotoNaskh");

  // Get table reference
  const table = document.querySelector('.pos-invoice-table');
  const rows = table.querySelectorAll('tbody tr');

  // Extract table data
  const tableData = [];
  rows.forEach(row => {
    const rowData = [];
    row.querySelectorAll('td').forEach(cell => {
      if (cell.matches('.id-td') || (invoiceType !== 'iPower' && cell.matches('.box-id-td')) || cell.matches('.target-inv-td') || cell.matches('.delete-td')) return
      rowData.push(
        cell.matches('.price-td') ? (parseFloat(cell.innerHTML.replace(/,/g, '')) * 1000).toLocaleString()  : 
        cell.matches('.total-td') ? (parseFloat(cell.innerHTML.replace(/,/g, '')) * 1000).toLocaleString()  :
        cell.innerText
      ); // Remove extra spaces
    });
    tableData.push(rowData);
  });

  const excludedClasses = ['item-id', 'target-inv-th', 'delete-th', invoiceType !== 'iPower' ? 'box-id-th' : '']; // Add more classes here
  const headers = Array.from(table.querySelectorAll('thead th'))
    .filter(th => !excludedClasses.some(cls => th.classList.contains(cls))) // Exclude matching elements
    .map(th => th.innerText.trim()); // Extract text

  const response = await fetch(`${htt}://${serverIP}${port}/customers/${customerInp.getAttribute('data-id')}`);
  const customer = await response.json();
  const deliveryRespone = await fetch(`${htt}://${serverIP}${port}/deliveries/${deliveryInp.getAttribute('data-id')}`);
  const delivery = await deliveryRespone.json();
  const response2 = await fetch(`${htt}://${serverIP}${port}/posinvoices/${targettedInvoiceId}`);
  const posInvoice = await response2.json();

  const img = new Image();
  img.src = '../iPower_stamp.png'; // Make sure the file is in the correct path
  const loadImage = new Promise((resolve) => {
    img.onload = async function () {
      // Convert image to Base64 using Canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imgData = canvas.toDataURL('image/png'); // Convert to Base64
      
      const kurdish = languageSelect.value === 'Kurdish';
      const arabic = languageSelect.value === 'Arabic';

      const shopName = kurdish ? "پیشانگای ئایپاوەر" : arabic ? "محل ئايباور" : "iPower Shop";
      const Address = kurdish ? "هە ولیر کۆتری سە لام بینای شە هاب مۆڵ" : arabic ? "العنوان: أربيل كوتري سلام، مبنى شهـاب مول" : "Address: Erbil, Kotry Salam, Shahab Mall building";
      const invoiceNum = kurdish ? 'ژمارە ی وەسڵ' : arabic ? 'رقم فاتورة' : 'invoice Number';
      const customerName = kurdish ? 'ناوی کریار' : arabic ? 'اسم العميل' : 'Customer Name';
      const deliveryName = kurdish ? 'ناوی دلیڤە ری' : arabic ? 'اسم الدليفري' : 'Delivery Name';
      const date = kurdish ? 'بە روار' : arabic ? 'التاريخ'  : 'Date';
      const total = kurdish ? 'کۆی گشتی' : arabic ? 'الإجمالي' : 'Total';
      const Discount = kurdish ? 'داشکان' : arabic ? 'الخصم' : 'Discount';
      const netTotal = kurdish ? 'کۆتایی' : arabic ? 'بعد الخصم' : 'Net Total';
      const Quantity = kurdish ? 'دانە' : arabic ? 'عدد' : 'Quantity';
      const paymentStatus = kurdish ? 'دۆخی پارە دان' : arabic ? 'حالة الدفع' : 'Payment Status';
      const Cash = kurdish ? 'نە قد' : arabic ? 'نقد' : 'Cash';
      const Qarz = kurdish ? 'قە رز' : arabic ? 'دين' : 'Debt';
      const OldBalance = kurdish ? 'حیسابی کۆن' : arabic ? 'حساب القديم' : 'Old Balance';
      const Then = kurdish ? 'کە واتە' : arabic ? 'ثم' : 'Then';
      const currentBalance = kurdish ? 'حیسابی ئیستا' : arabic ? 'الحساب الحالي' : 'Current Balance';
      const rightUpperPosition = (kurdish || arabic) ? 142 : 15;
      const leftUpperPosition = (kurdish || arabic) ? 15 : 155;
      const rightLowerPosition = (kurdish || arabic) ? 155 : 15;
      const leftLowerPosition = (kurdish || arabic) ? 15 : 155;

      // Add shop information before the table
      doc.setFontSize(18);
      doc.text(shopName, 105, 10, { align: "center" }); // Centered title
      doc.setFontSize(11);
      doc.text(Address, 105, 16, { align: "center" });
      doc.text("Phone: 0751 845 4545 - 0750 344 6261", 105, 22, { align: "center" });
      doc.text((kurdish || arabic) ?  `${invoiceType === 'existingInvoice' ? posInvoice.id : invoiceId} :${invoiceNum}` : `${invoiceNum}: ${invoiceType === 'existingInvoice' ? posInvoice.id : invoiceId}`, rightUpperPosition, 30);
      doc.text((kurdish || arabic) ? `${customer.name} :${customerName}` : `${customerName}: ${customer.name}`, rightUpperPosition, 35);
      delivery.name !== 'No Delivery' ? doc.text((kurdish || arabic) ? `${delivery.name} :${deliveryName}` : `${deliveryName}: ${delivery.name}`, rightUpperPosition, 40) : '';
      doc.text((kurdish || arabic) ? `${invoiceType === 'existingInvoice' ? posInvoice.newDate.split(',')[0] : getLatestDate()} :${date}` : `${date}: ${invoiceType === 'existingInvoice' ? posInvoice.newDate.split(',')[0] : getLatestDate()}`, leftUpperPosition, 30);
      doc.text((kurdish || arabic) ? `${invoiceType === 'existingInvoice' ? formatDateTime(posInvoice.newDate)  : getLatestTime()}` : `${invoiceType === 'existingInvoice' ? formatDateTime(posInvoice.newDate)  : getLatestTime()}`, leftUpperPosition, 35);

      // Generate PDF table
      doc.autoTable({
        head: [headers],
        body: tableData,
        startY: delivery.name !== 'No Delivery' ? 43 : 38, // Space from top
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 2, halign: 'center', textColor: [0, 0, 0]},
        headStyles: {textColor: [255, 255, 255]},
        margin: { bottom: 30 }, // Reserve space for footer
        didDrawPage: function (data) {
          lastTableY = data.cursor.y; // Save last position of table
        },
        showHead: 'firstPage'
      });
      
      // Get final Y position after the table
      let finalY = lastTableY + 10; 
      let pageHeight = doc.internal.pageSize.height; 
      doc.addImage(imgData, 'PNG', 70, finalY, 40, 40); // (image, type, x, y, width, height)
      
      // If footer exceeds page, create a new page
      if (finalY + 30 > pageHeight) {  
        doc.addPage();
        finalY = 20; // Reset Y position for new page
      }
      const respone2 = await fetch(`${htt}://${serverIP}${port}/loans/${customer.id}`);
      const loanList = await respone2.json();
      let totalBalance = 0;
      const filteredLoanList = loanList.filter(loan => loan.customer_id === customer.id);
      filteredLoanList.forEach(loan => totalBalance += Number(loan.amount));
      const discountVal = (Number(discountSpan.innerText.replace(/,/g, '')) * 1000).toLocaleString();

      // Add footer information **only once at the end**
      doc.text(`${total}: ${(Number(totalSpan.innerText.replace(/,/g, '')) * 1000).toLocaleString()}`, rightLowerPosition, finalY);
      doc.text(`${((kurdish || arabic) && discountVal !== '0') ? '-' : ''}${Discount}: ${(kurdish || arabic) ? (discountVal.replace('-', ' ')) : discountVal}`, rightLowerPosition, finalY + 6);
      doc.text(`${netTotal}: ${(Number(netTotalSpan.innerText.replace(/,/g, '')) * 1000).toLocaleString()}`, rightLowerPosition, finalY + 12);
      doc.text(`${Quantity}: ${totalQuantitySpan.innerText}`, rightLowerPosition, finalY + 18);

      doc.text(`${paymentStatus}: ${!loanCheckbox.checked ? `${Cash}` : `${Qarz}`}`, leftLowerPosition, finalY);
      const newCancelButt = document.querySelector('.new-cancel-butt');
      if (invoiceType !== 'existingInvoice' && !newCancelButt) {
        doc.text(`${OldBalance}: ${(Number(totalBalance) * 1000).toLocaleString()}`, leftLowerPosition, finalY + 6);
        if (loanCheckbox.checked) {
          doc.text(`${Then}: ${(Number(totalBalance) * 1000).toLocaleString()} + ${(Number(netTotalSpan.innerText.replace(/,/g, '')) * 1000).toLocaleString()}`, leftLowerPosition, finalY + 12);
          doc.text(`${currentBalance}: ${loanCheckbox.checked ? ((Number(totalBalance) + Number(netTotalSpan.innerText.replace(/,/g, '')))  * 1000).toLocaleString() : (Number(totalBalance) * 1000).toLocaleString()}`, leftLowerPosition, finalY + 18);
      }
      }
      else if ((invoiceType === 'existingInvoice' || 'iPower') && newCancelButt) {
      const netTotal = Number(netTotalSpan.innerText.replace(/,/g, ''));
      const oldBalance = Number(totalBalance) - netTotal;
      doc.text(`${OldBalance}: ${((loanCheckbox.checked ? oldBalance : oldBalance + netTotal) * 1000).toLocaleString()}`, leftLowerPosition, finalY + 6);
      if (loanCheckbox.checked) {
      doc.text(`${Then}: ${(oldBalance * 1000).toLocaleString()} + ${(netTotal * 1000).toLocaleString()}`, leftLowerPosition, finalY + 12);
      doc.text(`${currentBalance}: ${loanCheckbox.checked ? ((oldBalance + netTotal)  * 1000).toLocaleString() : (Number(totalBalance) * 1000).toLocaleString()}`, leftLowerPosition, finalY + 18);
      }
      } else {
        doc.text(`${OldBalance}: ${(Number(totalBalance) * 1000).toLocaleString()}`, leftLowerPosition, finalY + 6);
        if (loanCheckbox.checked) {
        doc.text(`${Then}: ${(Number(totalBalance) * 1000).toLocaleString()} + ${(Number(netTotalSpan.innerText.replace(/,/g, '')) * 1000).toLocaleString()}`, leftLowerPosition, finalY + 12);
        doc.text(`${currentBalance}: ${loanCheckbox.checked ? ((Number(totalBalance) + Number(netTotalSpan.innerText.replace(/,/g, '')))  * 1000).toLocaleString() : (Number(totalBalance) * 1000).toLocaleString()}`, leftLowerPosition, finalY + 18);
        }
      }
      // Save the PDF
      doc.save(`${customer.name}.pdf`); // Downloads as 'invoice.pdf'
      resolve();
    }
  })
  await loadImage; // Wait for image loading & PDF generation
}

function deleteRow() {
  tableTbody.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-row-icon')) {
      const targetRow = e.target.closest('tr');
      const targettedRowTableId = targetRow.querySelector('td.id-td').querySelector('.id-span').innerHTML;
    
      const index = currentInvoiceArrey.findIndex(item => item.querySelector('td.id-td').querySelector('.id-span').innerHTML === targettedRowTableId);
      if (index !== -1) {
        currentInvoiceArrey.splice(index, 1);
      }
      targetRow.remove();
      updateTotal();
    }
  });
};

const currentTableTbodyArrey = Array.from(tableTbody.children); 
function setAddeventlistenner() {
  tableTbody.querySelectorAll('.quantity-td').forEach(quantityTd => {
    quantityTd.addEventListener('click', (e) => {
      const targetTd = e.target;
      const priceTd = targetTd.closest('tr').querySelector('.price-td');
      const totalTd = targetTd.closest('tr').querySelector('.total-td');

      if (targetTd.querySelector('input')) {
        return
      }
      
      const oldValue = targetTd.innerHTML
      const newInp = document.createElement('input');
      newInp.type = 'number';
      newInp.value = oldValue;
      newInp.className = 'quantity-inp';
      targetTd.innerHTML = '';
      targetTd.appendChild(newInp);
      newInp.focus();
      newInp.select();

      newInp.addEventListener('blur', async () => {
        const itemId = targetTd.closest('tr').querySelector('.id-td').querySelector('.id-span').innerHTML;
        const response = await fetch(`${htt}://${serverIP}${port}/items/${itemId}`);
        const targetItem = await response.json();
        if (parseInt(newInp.value) > targetItem.quantity || parseInt(newInp.value) === 0) {
          Toastify({
            text: `This is an invalid quantity`,
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
        }

        targetTd.innerHTML = newInp.value.replace(/[^0-9]/g, '') || 1;
        totalTd.innerHTML = parseInt(targetTd.innerHTML) * parseFloat(priceTd.innerHTML.replace(/,/g, ''));

        const total = parseFloat(priceTd.innerHTML.replace(/,/g, '')) * parseFloat(targetTd.innerHTML);
        totalTd.innerHTML = total.toLocaleString();
        updateTotal();
        searchItemInp.select();
      });

      newInp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          newInp.blur();
        }
        if (['-', 'ArrowUp', 'ArrowDown', 'e', 'E'].includes(e.key)) {e.preventDefault()};
        
      })
    })
  });

  tableTbody.querySelectorAll('.price-td').forEach((priceTd) => {
    priceTd.addEventListener('click', (e) => {
      const targetTd = e.target;
      const quantityTd = targetTd.closest('tr').querySelector('.quantity-td');
      const totalTd = targetTd.closest('tr').querySelector('.total-td');
      
      if (targetTd.querySelector('input')) {
        return
      }
      const oldValue = targetTd.innerHTML.split(' ')[0].replace(/,/g, '')
      const newInp = document.createElement('input');
      newInp.type = 'number';
      newInp.value = oldValue;
      newInp.className = 'price-inp';
      targetTd.innerHTML = '';
      targetTd.appendChild(newInp);
      newInp.focus();
      newInp.select();
      
      newInp.addEventListener('blur', () => {
        targetTd.innerHTML = Number(newInp.value.trim()).toLocaleString() + ' IQD';
          const total = parseFloat(quantityTd.innerHTML) * parseFloat(targetTd.innerHTML.split(' ')[0].replace(/,/g, ''));
          totalTd.innerHTML = Number(total).toLocaleString();
          updateTotal();
          searchItemInp.select();
      });

      newInp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          newInp.blur();
        }
        if (['-', 'ArrowUp', 'ArrowDown', 'e', 'E'].includes(e.key)) {e.preventDefault()};
      })
    })
  });
};

function formatNumber(number) {
  return number % 1 === 0 ? number.toFixed(0) : number.toFixed(3);
};

async function fetchPosInvoice() {
  const response = await fetch(`${htt}://${serverIP}${port}/posinvoices/${targettedInvoiceId}`);
  const targetInvoice = await response.json();
  return targetInvoice;
};

async function fetchCustomerLoans() {
  const response = await fetch(`${htt}://${serverIP}${port}/loans`);
  const loans = await response.json();
  loans.forEach((loan) => {
    customerLoans.push(loan);
  })
}

async function fetchCustomers() {
  await fetchCustomerLoans();
  await setCustomerInpId();
  const response = await fetch(`${htt}://${serverIP}${port}/customers`);
  const customers = await response.json();
  customers.forEach((customer, index) => {
    if (customer.name === 'Customer Name') return;
    let total = 0;
    const customerLoansArray = customerLoans.filter(loan => loan.customer_id === customer.id);
    customerLoansArray.forEach(loan => {total += Number(loan.amount)})
    if (index === 0) customerInp.placeholder = `Fast Customer (${total.toLocaleString()})`;
    const newSpan = document.createElement('span');
    newSpan.className = 'customer-span';
    newSpan.innerHTML = customer.name + ` (${total.toLocaleString()})`;
    newSpan.setAttribute('data-id', customer.id);
    customDropdwon.appendChild(newSpan);
    customerListArray.push(newSpan);

    newSpan.addEventListener('click', (e) => {
      const customerName = e.target.innerHTML;
      const attribute = e.target.getAttribute('data-id');
      clickSpan(e, customerName, attribute, customerInp, inputContainerDiv, removeIcon, 'customer');
    })
  })
}

let index = -1;
customerInp.addEventListener('click', function (e) {
  inputContainerDiv.style.display = '';
})

customerInp.addEventListener('input', () => {
  Array.from(customDropdwon.children).forEach(span => span.style.backgroundColor = '');
  index = -1;
})

customerInp.addEventListener('keydown', (e) => {heilightArrow (e, customDropdwon, 'customer')});

// hide the customer dropdown
document.body.addEventListener('click', function (e) {
  if (!e.target.matches('.customer-inp') &&
   !e.target.matches('.customerRemoveIcon') &&
    !e.target.matches('#loan-checkbox') &&
    !e.target.matches('.pay-butt') &&
    !e.target.matches('#invoice-checkbox') &&
    !e.target.matches('label[for="invoice-checkbox"]')) { 
    inputContainerDiv.style.display = 'none';
    const mappedcustomersArray = customerListArray.map(span => span.innerHTML);
    Array.from(customDropdwon.children).forEach(span => span.style.backgroundColor = '');
    index = -1;
    if (customerInp.value.trim() == '') return 
    if (!mappedcustomersArray.includes(customerInp.value.trim())) {
      customerInp.style.backgroundColor = 'red';
    }
  }
})
document.body.addEventListener('click', function (e) {
  if (!e.target.matches('.category-inp') && !e.target.matches('.categoryRemoveIcon')) {
    categoryInputContainerDiv.style.display = 'none';
    Array.from(categoryCustomDropdwon.children).forEach(span => span.style.backgroundColor = '');
    categoryIndex = -1;
  }
})
document.body.addEventListener('click', function (e) {
  if (!e.target.matches('.delivery-inp') && !e.target.matches('.deliveryRemoveIcon')) {
    deliveryInputContainerDiv.style.display = 'none';
    Array.from(deliveryCustomDropdwon.children).forEach(span => span.style.backgroundColor = '');
    deliveryIndex = -1;
  }
})

removeIcon.addEventListener('click', async function () {
  this.style.display = 'none';
  customerInp.value = '';
  searchCustomers(customerInp, customerListArray, customDropdwon)
  customerInp.setAttribute('data-id', 1);
  const response = await fetch(`${htt}://${serverIP}${port}/customers/${1}`);
  const customer = await response.json();
  priceSelect.value = customer.priceLevel;
  priceSelect.dispatchEvent(new Event('change'));
  customerInp.focus();
  Array.from(customDropdwon.children).forEach(span => span.style.backgroundColor = '');
  index = -1;
})

customerInp.addEventListener('input', function () {
  searchCustomers(customerInp, customerListArray, customDropdwon)
})

// Search customers function
function searchCustomers(customerInp, customerListArray, customDropdwon) {
  const searchValue = customerInp.value.trim();
  const filteredArray = customerListArray.filter(span => {
    return span.innerHTML.toLowerCase().includes(searchValue.toLowerCase());
  })
  
  customDropdwon.innerHTML = '';
  filteredArray.forEach(span => {
    customDropdwon.appendChild(span)
  })
}

function heilightArrow (e, customDropdwon, inputType) {  const brandArray2 = Array.from(customDropdwon.children);
  if (!brandArray2.length) return; // Exit if no items

  // Remove previous highlight
  if (index >= 0) brandArray2[index].style.backgroundColor = '';

  if (e.key === 'ArrowDown') {
    index = Math.min(index + 1, brandArray2.length - 1); // Ensure it doesn't go beyond the last item
  } else if (e.key === 'ArrowUp') {
    index = Math.max(index - 1, -1); // Ensure it doesn't go below -1
  } else if (e.key === 'Enter') {
    const customerName = brandArray2[index].innerHTML;
    const attribute = brandArray2[index].getAttribute('data-id');
    if (inputType === 'customer') {
      clickSpan(e, customerName, attribute, customerInp, inputContainerDiv, removeIcon, 'customer');
    } else if (inputType === 'category') {
      clickSpan(e, customerName, '', categoryInp, categoryInputContainerDiv, categoryRemoveIcon, 'category');
    } else if (inputType === 'delivery') {
      clickSpan(e, customerName, attribute, deliveryInp, deliveryInputContainerDiv, deliveryRemoveIcon, 'delivery');
    }

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
};

async function clickSpan(e, customerName, attribute, customerInp, inputContainerDiv, removeIcon, inputType) {
  customerInp.value = customerName;
  inputContainerDiv.style.display = 'none';
  removeIcon.style.display = '';
  customerInp.style.backgroundColor = '';
  if (inputType === 'customer' || inputType === 'delivery') {
    customerInp.setAttribute('data-id', attribute);
    const response = await fetch(`${htt}://${serverIP}${port}/customers/${attribute}`);
    const customer = await response.json();
    if (inputType === 'customer') {
      priceSelect.value = customer.priceLevel;
      priceSelect.dispatchEvent(new Event('change'));
    }
  }
  else if (inputType === 'category') {
    isCategoryDropdown = true;
    fetchItems();
  }
  addDiscription();
}

const categoryRemoveIcon = document.querySelector('.categoryRemoveIcon');
async function fetchCategories() {
  const response = await fetch(`${htt}://${serverIP}${port}/category`);
  const category = await response.json();
  category.forEach(category => {
    if (category.name === 'Category') return;
    const newSpan = document.createElement('span');
    newSpan.className = 'category2-span';
    newSpan.innerHTML = category.name;
    categoryCustomDropdwon.appendChild(newSpan);
    categoryListArray.push(newSpan)
    newSpan.addEventListener('click', (e) => {
      const customerName = e.target.innerHTML;
      clickSpan(e, customerName, '', categoryInp, categoryInputContainerDiv, categoryRemoveIcon, 'category');
    })
  })
}

let categoryIndex = -1;
categoryInp.addEventListener('click', function (e) {
  categoryInputContainerDiv.style.display = '';
})

categoryInp.addEventListener('input', () => {
  Array.from(categoryCustomDropdwon.children).forEach(span => span.style.backgroundColor = '');
  index = -1;
})

categoryInp.addEventListener('keydown', (e) => {heilightArrow (e, categoryCustomDropdwon, 'category')});

categoryRemoveIcon.addEventListener('click', function () {
  this.style.display = 'none';
  categoryInp.value = '';
  searchCustomers(categoryInp, categoryListArray, categoryCustomDropdwon);
  categoryInp.focus();
  Array.from(categoryCustomDropdwon.children).forEach(span => span.style.backgroundColor = '');
  index = -1;
  fetchItems();
  if (searchItemInp.value.trim() === '') {
    discriptionModels.innerHTML = '';
  } else {
    addDiscription();
  }
})

categoryInp.addEventListener('input', function () {
  searchCustomers(categoryInp, categoryListArray, categoryCustomDropdwon)
})

const deliveryRemoveIcon = document.querySelector('.deliveryRemoveIcon');
async function fetchDeliveries() {
  const response = await fetch(`${htt}://${serverIP}${port}/deliveries`);
  const deliveries = await response.json();
  deliveries.forEach((delivery, index) => {
    if (delivery.name === 'Delivery Name') return;
    if (index === 0) deliveryInp.placeholder = `No delivery`;
    const newSpan = document.createElement('span');
    newSpan.className = 'customer-span';
    newSpan.innerHTML = delivery.name;
    newSpan.setAttribute('data-id', delivery.id);
    deliveryCustomDropdwon.appendChild(newSpan);
    deliveryListArray.push(newSpan);

    newSpan.addEventListener('click', (e) => {
      const deliveryName = e.target.innerHTML;
      const attribute = e.target.getAttribute('data-id');
      clickSpan(e, deliveryName, attribute, deliveryInp, deliveryInputContainerDiv, deliveryRemoveIcon, 'delivery');
    })
  })
}

let deliveryIndex = -1;
deliveryInp.addEventListener('click', function (e) {
  deliveryInputContainerDiv.style.display = '';
})

deliveryInp.addEventListener('input', () => {
  Array.from(deliveryCustomDropdwon.children).forEach(span => span.style.backgroundColor = '');
  deliveryIndex = -1;
})

deliveryInp.addEventListener('keydown', (e) => {heilightArrow (e, deliveryCustomDropdwon, 'delivery')});

deliveryRemoveIcon.addEventListener('click', async function () {
  this.style.display = 'none';
  deliveryInp.value = '';
  searchCustomers(deliveryInp, deliveryListArray, deliveryCustomDropdwon)
  deliveryInp.setAttribute('data-id', 1);
  deliveryInp.focus();
  Array.from(deliveryCustomDropdwon.children).forEach(span => span.style.backgroundColor = '');
  deliveryIndex = -1;
})

deliveryInp.addEventListener('input', function () {
  searchCustomers(deliveryInp, deliveryListArray, deliveryCustomDropdwon)
})

searchItemInp.addEventListener('input', function () {
  isCategoryDropdown = true;
  fetchItems();
  clearInpIcon.style.display = 'block';
  if (searchItemInp.value.trim() === '') clearInpIcon.style.display = 'none';
  searchItemInp.value.trim() !== '' ? addDiscription() : discriptionModels.innerHTML = '';
});

searchItemInp.addEventListener('keydown', async function(e) {
  if (e.key === '=') {
    await fetchItems();
    setTimeout(() => {
      indicateUniversalModels();
    }, 50);
  };
})

clearInpIcon.addEventListener('click', function() {
  searchItemInp.value = '';
  fetchItems();
  this.style.display = 'none';
  searchItemInp.focus();
  discriptionModels.innerHTML = '';
  isCategoryDropdown = true;
})

function getLatestDate() {
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1; // Months are zero-based
  const year = currentDate.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;
  return formattedDate;
}

function getLatestTime() {
  const kurdish = languageSelect.value === 'Kurdish';
  const arabic = languageSelect.value === 'Arabic';
  const currentDate = new Date();
  const options = { 
      weekday: 'long', // Full day name (e.g., "Saturday")
      hour: 'numeric', // Hour in 12-hour format
      minute: 'numeric', // Minutes
      hour12: true // Use AM/PM format
  };
  let formattedTime = currentDate.toLocaleTimeString('en-US', options);
  const day = formattedTime.split(' ')[0];
  let tanslatedDay;
  if (kurdish) {
    day === 'Saturday' ? tanslatedDay = 'شە ممە' :
    day === 'Sunday' ? tanslatedDay = 'یەک شەممە' :
    day === 'Monday' ? tanslatedDay = 'دوو شە ممە' :
    day === 'Tuesday' ? tanslatedDay = 'سێ شەممە' :
    day === 'Wednesday' ? tanslatedDay = 'چوار شەممە' :
    day === 'Thursday' ? tanslatedDay = 'پینج شە ممە' :
    day === 'Friday' ? tanslatedDay = 'هە ینی' :
    '';
    formattedTime = `${formattedTime.split(' ')[1]} ${formattedTime.split(' ')[2]} ${tanslatedDay} `
  } else if (arabic) {
    day === 'Saturday' ? tanslatedDay = 'السبت  ' :
    day === 'Sunday' ? tanslatedDay = 'الأحد' :
    day === 'Monday' ? tanslatedDay = 'الاثنين' :
    day === 'Tuesday' ? tanslatedDay = 'الثلاثاء' :
    day === 'Wednesday' ? tanslatedDay = 'الأربعاء' :
    day === 'Thursday' ? tanslatedDay = 'الخميس' :
    day === 'Friday' ? tanslatedDay = 'الجمعة' :
    '';
    formattedTime = `${formattedTime.split(' ')[1]} ${formattedTime.split(' ')[2]} ${tanslatedDay} `
  }
  return formattedTime;
}

function formatDateTime(serverDateTime) {
  const kurdish = languageSelect.value === 'Kurdish';
  const arabic = languageSelect.value === 'Arabic';

  // Step 1: Parse the server datetime string into a Date object
  const [datePart, timePart] = serverDateTime.split(', ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);

  const dateObject = new Date(year, month - 1, day, hour, minute, second);

  // Step 2: Format the date and time
  const options = {
      weekday: 'long', // Full day name (e.g., "Saturday")
      hour: 'numeric', // Hour in 12-hour format
      minute: 'numeric', // Minutes
      hour12: true // Use AM/PM format
  };

  let formattedDateTime = dateObject.toLocaleString('en-US', options);
  const Day = formattedDateTime.split(' ')[0];
    let tanslatedDay;
  if (kurdish) {
    Day === 'Saturday' ? tanslatedDay = 'شە ممە' :
    Day === 'Sunday' ? tanslatedDay = 'یەک شەممە' :
    Day === 'Monday' ? tanslatedDay = 'دوو شە ممە' :
    Day === 'Tuesday' ? tanslatedDay = 'سێ شەممە' :
    Day === 'Wednesday' ? tanslatedDay = 'چوار شەممە' :
    Day === 'Thursday' ? tanslatedDay = 'پینج شە ممە' :
    Day === 'Friday' ? tanslatedDay = 'هە ینی' :
    '';
    formattedDateTime = `${formattedDateTime.split(' ')[1]} ${formattedDateTime.split(' ')[2]} ${tanslatedDay} `
  } else if (arabic) {
    Day === 'Saturday' ? tanslatedDay = 'السبت  ' :
    Day === 'Sunday' ? tanslatedDay = 'الأحد' :
    Day === 'Monday' ? tanslatedDay = 'الاثنين' :
    Day === 'Tuesday' ? tanslatedDay = 'الثلاثاء' :
    Day === 'Wednesday' ? tanslatedDay = 'الأربعاء' :
    Day === 'Thursday' ? tanslatedDay = 'الخميس' :
    Day === 'Friday' ? tanslatedDay = 'الجمعة' :
    '';
    formattedDateTime = `${formattedDateTime.split(' ')[1]} ${formattedDateTime.split(' ')[2]} ${tanslatedDay} `
  }
  return formattedDateTime;
}

fetchCategories();

async function fetchWorkers() {
  const response = await fetch(`${htt}://${serverIP}${port}/workers`);
  const workers = await response.json();
  const response2 = await fetch(`${htt}://${serverIP}${port}/posinvoices/${targettedInvoiceId}`);
  const posInvoice = await response2.json();
  workers.forEach((worker, index) => {
    const newSpan = document.createElement('span');
    newSpan.className = 'worker-span';
    newSpan.innerHTML = worker.name;
    newSpan.style.padding = '0.4vw';
    newSpan.setAttribute('data-id', worker.id);
    workerNamesDiv.appendChild(newSpan);
    if ((Number(newSpan.getAttribute('data-id')) === Number(posInvoice.workerId))) {
      newSpan.style.backgroundColor = 'rgb(35, 199, 174)';
      newSpan.style.color = 'rgb(255, 255, 255)';
    }
    newSpan.addEventListener('click', (e) => {
      workerNamesDiv.querySelectorAll('span').forEach(span => span.style.backgroundColor = '');
      newSpan.style.backgroundColor = 'rgb(35, 199, 174)';
      newSpan.style.color = 'rgb(255, 255, 255)';
      localStorage.setItem('workerName', Number(newSpan.getAttribute('data-id')));
    })
  })
}

fetchWorkers();

document.addEventListener('click', function(e) {
  const targetLink = e.target.closest('a');
  if (targetLink) {
    sessionStorage.removeItem('tableScrollTop');
  } 
})

let holdTimer;
isHeld = false;
printIcon.addEventListener('mousedown', function() {
  isHeld = false;
  holdTimer = setTimeout(() => {
    isHeld = true;
    printInvoice('iPower', 'iPower')
  }, 800)
})

printIcon.addEventListener('mouseup', function() {
  clearTimeout(holdTimer); // Cancel if released early
  setTimeout(() => {isHeld = false}, 50)
});

printIcon.addEventListener('mouseleave', function() {
  clearTimeout(holdTimer);
});

let printHoldTimer;

printIcon.addEventListener('touchstart', function() {
  printHoldTimer = setTimeout(() => {
    printInvoice('iPower', 'iPower');
  }, 800);
}, { passive: true });

printIcon.addEventListener('touchend', function() {
  clearTimeout(printHoldTimer);
});

printIcon.addEventListener('touchcancel', function() {
  clearTimeout(printHoldTimer);
});


loanCheckbox.addEventListener('click', function() {
  inputContainerDiv.style.display = loanCheckbox.checked ? '' : 'none';
  customerInp.focus();
  payButt.innerHTML = payButt.innerHTML === 'Submit' ? 'Submit Loan' : 'Submit';
  if (payButt.innerHTML === 'Submit Loan') {
    payButt.style.color = 'rgb(139, 3, 3)';
    payButt.style.backgroundColor = 'rgb(222, 220, 223)';
    payButt.addEventListener('mouseenter', function() {
      if (this.innerHTML === 'Submit Loan') this.style.backgroundColor = 'rgb(137, 137, 137)'
    })
    payButt.addEventListener('mouseleave', function() {
      if (this.innerHTML === 'Submit Loan') this.style.backgroundColor = 'rgb(222, 220, 223)';
    })
  } else {
    payButt.style.color = '';
    payButt.style.backgroundColor = '';
  }
})

document.body.addEventListener('keydown', function(e) {
  if (e.key === 'F1' || e.key === 'F2' || e.key === 'F3' || e.key === 'F4' || e.key === 'F5' || e.key === 'F6' ||
    e.key === 'F7' || e.key === 'F8' || e.key === 'F9' || e.key === 'F10' || e.key === 'F11' || e.key === 'F12'
  ) {
    e.preventDefault();
    if (e.key === 'F1') {
      const submitButt = document.querySelector('.pay-butt');
      if (submitButt.style.display === '')
      payButt.click();
    }
    else if (e.key === 'F2') document.querySelectorAll('.quantity-td')[0]?.click();
    else if (e.key === 'F3') document.querySelectorAll('.price-td')[0]?.click();
    else if (e.key === 'F4') loanCheckbox.click();
    else if (e.key === 'F5') {
      const cancelButt = document.querySelector('.new-cancel-butt');
      if (cancelButt?.style.display === '')
      cancelButt?.click();
    }
    else if (e.key === 'F6') noteInp.focus();
    else if (e.key === 'F11') {
    const submitButt = document.querySelector('.pay-butt');
    if (submitButt.style.display === '')
      discountButt.click();
    }
  }
})

let isCategoryDropdown = false;
let isInitialPageEntering = true;
// Price select change
priceSelect.addEventListener('change', function() {
  const prLev = this.value;
  const squareContainer = document.querySelector('.square-item-container-div');
  for(const squareDiv of Array.from(squareContainer.children)) {
    const itemId = Number(squareDiv.querySelector('.id-span').innerHTML);
    const itemPriceElement = squareDiv.querySelector('.price-one-span');
    const targetTableItem = itemList.find(item => item.id === itemId);
    const buyPrice = Number(targetTableItem.buyPrice);
    const realPrice = Number(targetTableItem.priceOne);
    itemPriceElement.innerHTML = (prLev !== 'Price Four' ? customRound(indicateProfit(buyPrice, realPrice, prLev)) : realPrice) + ' IQD';
  }
  if (isCategoryDropdown || isInitialPageEntering ) return;
  for(const row of Array.from(tableTbody.children)) {
    const itemId = Number(row.querySelector('.id-td .id-span').innerHTML);
    const itemPriceTd = row.querySelector('.price-td');
    const itemTotalPriceTd = row.querySelector('.total-td');
    const itemQnt = row.querySelector('.quantity-td').innerHTML;
    const targetTableItem = itemList.find(item => item.id === itemId);
    const buyPrice = Number(targetTableItem.buyPrice);
    const realPrice = Number(targetTableItem.priceOne);
    itemPriceTd.innerHTML = (prLev !== 'Price Four' ? customRound(indicateProfit(buyPrice, realPrice, prLev)) : realPrice) + ' IQD';
    itemTotalPriceTd.innerHTML = Number(itemPriceTd.innerHTML.split(' ')[0]) * Number(itemQnt)
  }
  updateTotal();
})

function indicateProfit(buyPrice, realPrice, prLev) {
  let extraProfitAmount = 0
  if (realPrice <= 2) {
    if (prLev === 'Price One' || prLev === 'Price Two' || prLev === 'Price Three') {
      extraProfitAmount = 0;
      return ((0.5 + extraProfitAmount) + buyPrice) >= realPrice ? realPrice : buyPrice + (0.5 + extraProfitAmount);
    } else {
      return realPrice + 1;
    }
  }
  else if (realPrice <= 5) {
    if (prLev === 'Price One' || prLev === 'Price Two' || prLev === 'Price Three') {
      extraProfitAmount = 0;
      return ((1 + extraProfitAmount) + buyPrice) >= realPrice ? realPrice : buyPrice + (1 + extraProfitAmount);
    } else {
      return realPrice + 1;
    }
  }
  else if (realPrice <= 10) {
    if (prLev === 'Price One' || prLev === 'Price Two' || prLev === 'Price Three') {
      extraProfitAmount = prLev === 'Price One' ? 0 : prLev === 'Price Two' ? 0.25 : prLev === 'Price Three' ? 0.5 : ''
      return ((1.5 + extraProfitAmount) + buyPrice) >= realPrice ? realPrice : buyPrice + (1.5 + extraProfitAmount);
    } else {
      return realPrice + 2;
    }
  }
  else if (realPrice <= 30) {
    if (prLev === 'Price One' || prLev === 'Price Two' || prLev === 'Price Three') {
      extraProfitAmount = prLev === 'Price One' ? 0 : prLev === 'Price Two' ? 0.25 : prLev === 'Price Three' ? 0.5 : ''
      return ((2 + extraProfitAmount) + buyPrice) >= realPrice ? realPrice : buyPrice + (2 + extraProfitAmount);
    } else {
      return realPrice + 2;
    }
  }
  else if (realPrice <= 45) {
    if (prLev === 'Price One' || prLev === 'Price Two' || prLev === 'Price Three') {
      extraProfitAmount = prLev === 'Price One' ? 0 : prLev === 'Price Two' ? 0.5 : prLev === 'Price Three' ? 1 : ''
      return ((3 + extraProfitAmount) + buyPrice) >= realPrice ? realPrice : buyPrice + (3 + extraProfitAmount);
    } else {
      return realPrice + 3;
    }
  }
  else if (realPrice <= 53) {
    if (prLev === 'Price One' || prLev === 'Price Two' || prLev === 'Price Three') {
      extraProfitAmount = prLev === 'Price One' ? 0 : prLev === 'Price Two' ? 0.5 : prLev === 'Price Three' ? 1 : ''
      return  ((4 + extraProfitAmount) + buyPrice) >= realPrice ? realPrice : buyPrice + (4 + extraProfitAmount);
    } else {
      return realPrice + 3;
    }
  }
  else if (realPrice <= 70) {
    if (prLev === 'Price One' || prLev === 'Price Two' || prLev === 'Price Three') {
      extraProfitAmount = prLev === 'Price One' ? 0 : prLev === 'Price Two' ? 1 : prLev === 'Price Three' ? 2 : ''
      return ((5 + extraProfitAmount) + buyPrice) >= realPrice ? realPrice : buyPrice + (5 + extraProfitAmount);
    } else {
      return realPrice + 4;
    }
  }
  else if (realPrice <= 75) {
    if (prLev === 'Price One' || prLev === 'Price Two' || prLev === 'Price Three') {
      extraProfitAmount = prLev === 'Price One' ? 0 : prLev === 'Price Two' ? 1 : prLev === 'Price Three' ? 2 : ''
      return ((6 + extraProfitAmount) + buyPrice) >= realPrice ? realPrice : buyPrice + (6 + extraProfitAmount);
    } else {
      return realPrice + 5;
    }
  }
  else if (realPrice <= 90) {
    if (prLev === 'Price One' || prLev === 'Price Two' || prLev === 'Price Three') {
      extraProfitAmount = prLev === 'Price One' ? 0 : prLev === 'Price Two' ? 1 : prLev === 'Price Three' ? 2 : ''
      return ((7 + extraProfitAmount) + buyPrice) >= realPrice ? realPrice : buyPrice + (7 + extraProfitAmount);
    } else {
      return realPrice + 5;
    }
  }
  else if (realPrice <= 100) {
    if (prLev === 'Price One' || prLev === 'Price Two' || prLev === 'Price Three') {
      extraProfitAmount = prLev === 'Price One' ? 0 : prLev === 'Price Two' ? 1 : prLev === 'Price Three' ? 2 : ''
      return ((10 + extraProfitAmount) + buyPrice) >= realPrice ? realPrice : buyPrice + (10 + extraProfitAmount);
    } else {
      return realPrice + 6;
    }
  }
  else if (realPrice <= 120) {
    if (prLev === 'Price One' || prLev === 'Price Two' || prLev === 'Price Three') {
      extraProfitAmount = prLev === 'Price One' ? 0 : prLev === 'Price Two' ? 2 : prLev === 'Price Three' ? 3 : ''
      return ((12 + extraProfitAmount) + buyPrice) >= realPrice ? realPrice : buyPrice + (12 + extraProfitAmount);
    } else {
      return realPrice + 7;
    }
  }
  else if (realPrice <= 150) {
    if (prLev === 'Price One' || prLev === 'Price Two' || prLev === 'Price Three') {
      extraProfitAmount = prLev === 'Price One' ? 0 : prLev === 'Price Two' ? 2 : prLev === 'Price Three' ? 4 : ''
      return ((15 + extraProfitAmount) + buyPrice) >= realPrice ? realPrice : buyPrice + (15 + extraProfitAmount);
    } else {
      return realPrice + 8;
    }
  }
  else if (realPrice <= 200) {
    if (prLev === 'Price One' || prLev === 'Price Two' || prLev === 'Price Three') {
      extraProfitAmount = prLev === 'Price One' ? 0 : prLev === 'Price Two' ? 3 : prLev === 'Price Three' ? 6 : ''
      return ((20 + extraProfitAmount) + buyPrice) >= realPrice ? realPrice : buyPrice + (20 + extraProfitAmount);
    } else {
      return realPrice + 10;
    }
  }
  else if (realPrice > 200) {
    if (prLev === 'Price One' || prLev === 'Price Two' || prLev === 'Price Three') {
      extraProfitAmount = prLev === 'Price One' ? 0 : prLev === 'Price Two' ? 5 : prLev === 'Price Three' ? 7 : ''
      return ((30 + extraProfitAmount) + buyPrice) >= realPrice ? realPrice : buyPrice + (30 + extraProfitAmount);
    } else {
      return realPrice + 12;
    }
  }
}

function customRound(num) {
  const whole = Math.floor(num);
  const decimal = (num - whole) * 100;
  if (decimal < 5) {
      return whole;
  } else if (decimal < 35) {
      return whole + 0.25;
  } else if (decimal < 65) {
      return whole + 0.5;
  } else if (decimal < 85) {
    return whole + 0.75;
  } else {
      return whole + 1;
  }
}

function indicateUniversalModels() {
  const searchVal = searchItemInp.value.trim();
  Array.from(squareContainer.children).forEach(squareDiv => {
    const discription = squareDiv.querySelector('.discription-span').innerHTML.toLowerCase();
    if(discription.includes(searchVal.toLowerCase())) {
      squareDiv.style.color = 'rgb(223, 229, 29)';
    }
  })
}

async function addDiscription() {
  const similiarNames = [];
  discriptionModels.innerHTML = '';
  similiarNames.length = 0;
  const searchVal = searchItemInp.value.trim();
  const categoryInpVal = categoryInp.value.replace(/\+/g, 'plus');
  const response = await fetch(`${htt}://${serverIP}${port}/itemsFilter?search=${searchVal}&categoryDivVal=${categoryInpVal}`);
  const items = await response.json();
  const splittedVal = searchVal.split(' ');
  const filteredItem = items.filter(item => {
    const combinedText = (item.brand_name + item.model_name + item.category_name + item.quality_name + (item.SKU || '') + (item.boxId || '') + (item.discription || '')).toLowerCase();
    const itemMatch = splittedVal.every(term => combinedText.includes(term.toLowerCase()));
    return itemMatch && !(item.disable === 'checked') && !(item.discription === null || item.discription === '');
  })
  discriptionModels.value = filteredItem[0]?.discription;
  filteredItem.forEach(item => {
    if (similiarNames.includes(item.discription)) return;
    const newOption = document.createElement('option');
    newOption.text = `[${item.category_name}] ${item.brand_name} ${item?.discription}`;
    if (newOption.text.length > 200) newOption.style.fontSize = '0.6vw'
    discriptionModels.appendChild(newOption);
    similiarNames.push(item.discription);
  })
}

const searchItem = document.querySelector('.invoice-table-search-inp');
const existingItemSpan = document.querySelector('.existing-item-span');
searchItem.addEventListener('input', function() {
  searchTable();
})

function searchTable() {
  const table  = document.querySelector('.invoice-table-container');
  const searchVal = (searchItem.value.trim()).toLowerCase();
  const splittedVal = searchVal.split(' ');
  const items = Array.from(table.querySelector('.pos-invoice-table').querySelector('.table-tbody').children);
  items.forEach(row => {row.querySelector('.name-td').querySelector('.item-name-span').style.color = ''});
  const filteredArray = items.filter(itemRow => {
    const itemDetail = (itemRow.querySelector('.name-td').querySelector('.item-name-span').innerHTML + itemRow.querySelector('.name-td').querySelector('.item-inf-span').innerHTML).toLowerCase();
    return splittedVal.every(term => itemDetail.includes(term.toLowerCase()));
  })
  let total = 0;
  if (filteredArray.length === 0) existingItemSpan.innerHTML = 0;
  filteredArray.forEach((row, index) => {
    if (searchVal === '') {
      existingItemSpan.innerHTML = 0;
      return;
    };
    const itemNameSpan = row.querySelector('.name-td').querySelector('.item-name-span');
    itemNameSpan.style.color = 'Yellow';
    total += 1;
    existingItemSpan.innerHTML = total;
      // Scroll to the first matching item
    if (index === 0) {
      itemNameSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  })
}

searchItem.value = localStorage.getItem('searchInpVal') || '';

languageSelect.addEventListener('change', function () {
  const langauseSelectVal = this.value;
  localStorage.setItem('langauseSelectVal', langauseSelectVal);
})

languageSelect.value = localStorage.getItem('langauseSelectVal') || 'Kurdish';

function setWorker() {
  let workerId;
  (workerNamesDiv.querySelectorAll('span')).forEach(span => {
    if (span.style.backgroundColor === 'rgb(35, 199, 174)') {
      workerId =  span.getAttribute('data-id');
    };
  });
  return workerId;
}

// This is related to invoice.html
document.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', (e) => {
    const nextPage = link.href;
    sessionStorage.removeItem('pos-filters');
    console.log(sessionStorage.removeItem('pos-filters'))
  });
});
