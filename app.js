// 汽修店CRM系统 - 主要逻辑
class CarRepairCRM {
    constructor() {
        this.customers = JSON.parse(localStorage.getItem('customers')) || [];
        this.vehicles = JSON.parse(localStorage.getItem('vehicles')) || [];
        this.maintenanceRecords = JSON.parse(localStorage.getItem('maintenanceRecords')) || [];
        this.init();
    }

    init() {
        this.renderCustomers();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 表单提交事件
        document.getElementById('customerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCustomer();
        });
        
        // 搜索功能事件
        this.setupSearchListeners();
        
        // 搜索结果点击事件（一次性绑定）
        document.getElementById('searchResults').addEventListener('click', (e) => {
            const item = e.target.closest('.search-result-item');
            if (item) {
                const type = item.dataset.type;
                const id = item.dataset.id;
                
                if (type === 'customer') {
                    this.goToCustomer(id);
                } else if (type === 'vehicle') {
                    this.goToVehicle(id);
                }
            }
        });

        // 客户模态框关闭时清除编辑状态
        document.getElementById('addCustomerModal').addEventListener('hidden.bs.modal', () => {
            this.currentEditingCustomerId = null;
            document.querySelector('#addCustomerModal .modal-title').textContent = '添加客户';
        });

        // 保养提醒筛选事件
        document.querySelectorAll('input[name="reminderFilter"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.filterReminders(radio.value);
            });
        });

        // 维修记录模态框关闭时清除编辑状态
        document.getElementById('addMaintenanceModal').addEventListener('hidden.bs.modal', () => {
            this.currentEditingMaintenanceId = null;
            document.querySelector('#addMaintenanceModal .modal-title').textContent = '添加维修记录';
        });
    }

    // 页面切换功能
    showPage(pageId) {
        // 隐藏所有页面
        const pages = document.querySelectorAll('.page-content');
        pages.forEach(page => page.style.display = 'none');
        
        // 显示目标页面
        document.getElementById(pageId + '-page').style.display = 'block';
        
        // 更新导航栏活动状态
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        event.target.classList.add('active');

        // 根据页面刷新内容
        switch(pageId) {
            case 'customers':
                this.renderCustomers();
                break;
            case 'vehicles':
                this.renderVehicles();
                break;
            case 'maintenance':
                this.renderMaintenanceRecords();
                break;
            case 'reminders':
                this.renderReminders();
                break;
            case 'notifications':
                this.renderNotifications();
                break;
            case 'statistics':
                this.renderStatistics();
                break;
        }
    }

    // 客户管理功能
    showAddCustomerModal() {
        // 清除编辑状态
        this.currentEditingCustomerId = null;
        
        // 清空表单
        document.getElementById('customerName').value = '';
        document.getElementById('customerPhone').value = '';
        document.getElementById('customerAddress').value = '';
        
        // 清空新字段
        const customerWechat = document.getElementById('customerWechat');
        if (customerWechat) customerWechat.value = '';
        
        // 重置标签复选框
        document.getElementById('oldCustomer').checked = false;
        document.getElementById('vipCustomer').checked = false;
        
        // 重置通知设置
        document.getElementById('enableWechatNotif').checked = true;
        document.getElementById('enableSmsNotif').checked = false;
        
        // 兼容旧字段
        const customerEmail = document.getElementById('customerEmail');
        if (customerEmail) customerEmail.value = '';
        
        const normalCustomerRadio = document.querySelector('input[name="customerType"][value="普通客户"]');
        if (normalCustomerRadio) {
            normalCustomerRadio.checked = true;
        }
        
        // 清除验证错误
        document.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
        document.querySelectorAll('.invalid-feedback').forEach(el => {
            el.remove();
        });
        
        // 重置模态框标题
        document.querySelector('#addCustomerModal .modal-title').textContent = '添加客户';
        
        const modal = new bootstrap.Modal(document.getElementById('addCustomerModal'));
        modal.show();
    }

    saveCustomer() {
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const address = document.getElementById('customerAddress').value.trim();
        
        // 获取新字段
        const customerWechat = document.getElementById('customerWechat');
        const wechat = customerWechat ? customerWechat.value.trim() : '';
        
        // 获取标签
        const tags = [];
        if (document.getElementById('oldCustomer').checked) {
            tags.push('老客户');
        }
        if (document.getElementById('vipCustomer').checked) {
            tags.push('大客户');
        }
        
        // 获取通知设置
        const enableWechatNotif = document.getElementById('enableWechatNotif').checked;
        const enableSmsNotif = document.getElementById('enableSmsNotif').checked;
        
        // 兼容旧字段
        const customerEmail = document.getElementById('customerEmail');
        const email = customerEmail ? customerEmail.value.trim() : '';
        
        const typeRadio = document.querySelector('input[name="customerType"]:checked');
        const type = typeRadio ? typeRadio.value : '普通客户';

        // 表单验证
        if (!this.validateCustomerForm(name, phone)) {
            return;
        }

        if (this.currentEditingCustomerId) {
            // 编辑模式：更新现有客户
            const customerIndex = this.customers.findIndex(c => c.id === this.currentEditingCustomerId);
            if (customerIndex !== -1) {
                const existingCustomer = this.customers[customerIndex];
                this.customers[customerIndex] = {
                    ...existingCustomer, // 保留原有数据
                    name: name,
                    phone: phone,
                    email: email,
                    address: address,
                    type: type,
                    tags: tags,
                    wechat: wechat,
                    notifications: {
                        wechat: enableWechatNotif,
                        sms: enableSmsNotif
                    },
                    updatedAt: new Date().toISOString() // 添加更新时间
                };
                
                this.showToast('客户信息更新成功！', 'success');
            }
            
            // 清除编辑状态
            this.currentEditingCustomerId = null;
        } else {
            // 新增模式：创建新客户
            const customer = {
                id: Date.now().toString(),
                name: name,
                phone: phone,
                email: email,
                address: address,
                type: type,
                tags: tags,
                wechat: wechat,
                notifications: {
                    wechat: enableWechatNotif,
                    sms: enableSmsNotif
                },
                createdAt: new Date().toISOString(),
                lastVisit: null
            };

            this.customers.push(customer);
            this.showToast('客户添加成功！', 'success');
        }

        // 保存到本地存储
        this.saveToStorage('customers', this.customers);

        // 关闭模态框并刷新列表
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
        modal.hide();
        this.renderCustomers();
        
        // 更新车辆表单中的客户选项
        this.updateVehicleCustomerOptions();
    }

    validateCustomerForm(name, phone) {
        let isValid = true;

        // 清除之前的验证状态
        document.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
        document.querySelectorAll('.invalid-feedback').forEach(el => {
            el.remove();
        });

        // 验证姓名
        if (!name) {
            this.showFieldError('customerName', '请输入客户姓名');
            isValid = false;
        }

        // 验证手机号
        if (!phone) {
            this.showFieldError('customerPhone', '请输入联系电话');
            isValid = false;
        } else if (!/^1[3-9]\d{9}$/.test(phone)) {
            this.showFieldError('customerPhone', '请输入正确的手机号码');
            isValid = false;
        }

        // 检查手机号是否已存在
        if (phone && this.customers.some(customer => customer.phone === phone)) {
            this.showFieldError('customerPhone', '该手机号已存在');
            isValid = false;
        }

        return isValid;
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        field.classList.add('is-invalid');
        
        const feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        feedback.textContent = message;
        field.parentNode.appendChild(feedback);
    }

    renderCustomers() {
        const container = document.getElementById('customers-list');
        
        if (this.customers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h4>还没有客户</h4>
                    <p>点击上方"添加客户"按钮开始添加客户信息</p>
                </div>
            `;
            return;
        }

        const customersHtml = this.customers.map(customer => {
            // 计算该客户拥有的车辆数量
            const vehicleCount = this.vehicles.filter(vehicle => vehicle.customerId === customer.id).length;
            
            // 生成标签HTML
            const tagsHtml = customer.tags && customer.tags.length > 0 
                ? customer.tags.map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('')
                : '';
            
            // 计算上次来店时间
            const lastVisitHtml = customer.lastVisit 
                ? `<small class="text-muted d-block">上次来店: ${new Date(customer.lastVisit).toLocaleDateString()}</small>`
                : '<small class="text-muted d-block">上次来店: 暂无记录</small>';
            
            // 检查是否需要高亮
            const isHighlighted = this.highlightTargetId === customer.id;
            const highlightClass = isHighlighted ? ' highlighted-item' : '';
            
            return `
            <div class="customer-card${highlightClass}" data-customer-id="${customer.id}">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <div class="customer-info">
                            <div class="d-flex align-items-center mb-2">
                                <h5 class="mb-0 me-2"><i class="fas fa-user me-2"></i>${customer.name}</h5>
                                ${tagsHtml}
                            </div>
                            <p><i class="fas fa-phone me-2"></i>${customer.phone}</p>
                            ${customer.address ? `<p><i class="fas fa-map-marker-alt me-2"></i>${customer.address}</p>` : ''}
                            <p class="mb-2">
                                <span class="badge bg-info cursor-pointer" onclick="crm.viewCustomerVehicles('${customer.id}')" title="点击查看车辆详情">
                                    <i class="fas fa-car me-1"></i>拥有 ${vehicleCount} 辆车
                                </span>
                            </p>
                            <small class="text-muted">添加时间: ${new Date(customer.createdAt).toLocaleDateString()}</small>
                            ${lastVisitHtml}
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-success" onclick="crm.updateLastVisit('${customer.id}')" title="标记来店">
                                <i class="fas fa-clock"></i>
                            </button>
                            <button class="btn btn-outline-primary" onclick="crm.editCustomer('${customer.id}')" title="编辑">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-info" onclick="crm.viewCustomerVehicles('${customer.id}')" title="查看车辆">
                                <i class="fas fa-car"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="crm.deleteCustomer('${customer.id}')" title="删除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        }).join('');

        container.innerHTML = customersHtml;
        
        // 清除高亮标记（防止下次渲染时误高亮）
        if (this.highlightTargetId) {
            setTimeout(() => {
                this.highlightTargetId = null;
            }, 3000); // 3秒后清除高亮
        }
    }

    updateLastVisit(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
            customer.lastVisit = new Date().toISOString();
            this.saveToStorage('customers', this.customers);
            this.renderCustomers();
            this.showToast(`已标记 ${customer.name} 来店时间`, 'success');
        }
    }

    editCustomer(customerId) {
        console.log('editCustomer called with ID:', customerId);
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) {
            this.showToast('客户不存在', 'error');
            return;
        }

        // 设置当前编辑的客户ID
        this.currentEditingCustomerId = customerId;

        // 填充表单数据
        document.getElementById('customerName').value = customer.name;
        document.getElementById('customerPhone').value = customer.phone;
        document.getElementById('customerEmail').value = customer.email || '';
        document.getElementById('customerAddress').value = customer.address || '';
        
        // 设置客户类型
        const customerTypes = document.querySelectorAll('input[name="customerType"]');
        customerTypes.forEach(radio => {
            radio.checked = radio.value === customer.type;
        });

        // 更改模态框标题和按钮文本
        document.querySelector('#addCustomerModal .modal-title').textContent = '编辑客户信息';
        
        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById('addCustomerModal'));
        modal.show();
    }

    viewCustomerVehicles(customerId) {
        // 切换到车辆管理页面并筛选该客户的车辆
        this.currentFilteredCustomerId = customerId;
        
        // 切换页面
        this.showPage('vehicles');
        
        // 更新导航栏状态
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        document.querySelector('a[onclick*="vehicles"]').classList.add('active');
        
        // 显示客户信息提示
        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
            this.showToast(`正在查看 ${customer.name} 的车辆信息`, 'info');
        }
    }

    deleteCustomer(customerId) {
        if (!confirm('确定要删除这个客户吗？删除后无法恢复。')) {
            return;
        }

        this.customers = this.customers.filter(customer => customer.id !== customerId);
        this.saveToStorage('customers', this.customers);
        this.renderCustomers();
        this.showToast('客户删除成功！', 'success');
    }

    // 车辆管理功能
    renderVehicles() {
        const container = document.getElementById('vehicles-list');
        
        // 获取要显示的车辆（可能被客户筛选）
        let vehiclesToShow = this.vehicles;
        if (this.currentFilteredCustomerId) {
            vehiclesToShow = this.vehicles.filter(vehicle => vehicle.customerId === this.currentFilteredCustomerId);
        }
        
        if (vehiclesToShow.length === 0) {
            const emptyMessage = this.currentFilteredCustomerId 
                ? '该客户还没有车辆记录'
                : '还没有车辆记录';
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-car"></i>
                    <h4>${emptyMessage}</h4>
                    <p>点击上方"添加车辆"按钮开始添加车辆信息</p>
                </div>
            `;
            return;
        }

        const vehiclesHtml = vehiclesToShow.map(vehicle => {
            const customer = this.customers.find(c => c.id === vehicle.customerId);
            const customerName = customer ? customer.name : '未知客户';
            
            // 计算该车辆的维修记录数量
            const maintenanceCount = this.maintenanceRecords.filter(record => record.vehicleId === vehicle.id).length;
            
            // 检查是否需要高亮
            const isHighlighted = this.highlightTargetVehicleId === vehicle.id;
            const highlightClass = isHighlighted ? ' highlighted-item' : '';
            
            return `
            <div class="vehicle-card${highlightClass}" data-vehicle-id="${vehicle.id}">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <div class="vehicle-info">
                            <div class="d-flex align-items-center mb-2">
                                <h5 class="mb-0 me-2">
                                    <i class="fas fa-car me-2"></i>${vehicle.plate}
                                </h5>
                                <span class="badge bg-primary">${vehicle.brand} ${vehicle.model}</span>
                            </div>
                            <p class="mb-1">
                                <i class="fas fa-user me-2"></i>
                                <span class="text-primary cursor-pointer" onclick="crm.viewCustomerFromVehicle('${vehicle.customerId}')">${customerName}</span>
                            </p>
                            ${vehicle.year ? `<p class="mb-1"><i class="fas fa-calendar me-2"></i>${vehicle.year}年</p>` : ''}
                            ${vehicle.color ? `<p class="mb-1"><i class="fas fa-palette me-2"></i>${vehicle.color}</p>` : ''}
                            <p class="mb-2">
                                <span class="badge bg-info cursor-pointer" onclick="crm.viewVehicleMaintenance('${vehicle.id}')">
                                    <i class="fas fa-tools me-1"></i>${maintenanceCount} 次维修记录
                                </span>
                            </p>
                            <small class="text-muted">添加时间: ${new Date(vehicle.createdAt).toLocaleDateString()}</small>
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-success" onclick="crm.addMaintenanceRecord('${vehicle.id}')" title="添加维修记录">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="btn btn-outline-primary" onclick="crm.editVehicle('${vehicle.id}')" title="编辑">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-info" onclick="crm.viewVehicleMaintenance('${vehicle.id}')" title="查看维修记录">
                                <i class="fas fa-history"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="crm.deleteVehicle('${vehicle.id}')" title="删除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        }).join('');

        container.innerHTML = vehiclesHtml;
        
        // 更新客户筛选卡片显示
        this.updateCustomerFilterCard();
        
        // 清除高亮标记
        if (this.highlightTargetVehicleId) {
            setTimeout(() => {
                this.highlightTargetVehicleId = null;
            }, 3000);
        }
    }

    renderMaintenanceRecords() {
        const container = document.getElementById('maintenance-list');
        
        // 获取要显示的维修记录（可能被车辆筛选）
        let recordsToShow = this.maintenanceRecords;
        if (this.currentFilteredVehicleId) {
            recordsToShow = this.maintenanceRecords.filter(record => record.vehicleId === this.currentFilteredVehicleId);
        }
        
        // 按日期降序排列（最新的在前）
        recordsToShow.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (recordsToShow.length === 0) {
            const emptyMessage = this.currentFilteredVehicleId 
                ? '该车辆还没有维修记录'
                : '还没有维修记录';
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tools"></i>
                    <h4>${emptyMessage}</h4>
                    <p>点击上方"添加维修记录"按钮开始记录维修信息</p>
                </div>
            `;
            return;
        }

        const recordsHtml = recordsToShow.map(record => {
            const vehicle = this.vehicles.find(v => v.id === record.vehicleId);
            const customer = vehicle ? this.customers.find(c => c.id === vehicle.customerId) : null;
            
            const vehicleInfo = vehicle ? `${vehicle.plate} (${vehicle.brand} ${vehicle.model})` : '未知车辆';
            const customerName = customer ? customer.name : '未知客户';
            
            // 维修类型标签
            const typeLabels = record.types.map(type => 
                `<span class="badge bg-secondary me-1">${type}</span>`
            ).join('');
            
            return `
            <div class="maintenance-card">
                <div class="row">
                    <div class="col-md-8">
                        <div class="maintenance-info">
                            <div class="d-flex align-items-center mb-2">
                                <h5 class="mb-0 me-2">
                                    <i class="fas fa-tools me-2"></i>${new Date(record.date).toLocaleDateString()}
                                </h5>
                                <span class="badge bg-success">${record.mileage.toLocaleString()} 公里</span>
                            </div>
                            
                            <p class="mb-1">
                                <i class="fas fa-car me-2"></i>
                                <span class="text-primary cursor-pointer" onclick="crm.viewVehicleFromMaintenance('${record.vehicleId}')">${vehicleInfo}</span>
                                <span class="text-muted"> - ${customerName}</span>
                            </p>
                            
                            <div class="mb-2">${typeLabels}</div>
                            
                            ${record.description ? `<p class="mb-1 text-muted">${record.description}</p>` : ''}
                            
                            <div class="d-flex align-items-center text-muted small">
                                ${record.cost ? `<span class="me-3"><i class="fas fa-yen-sign me-1"></i>￥${Number(record.cost).toFixed(2)}</span>` : ''}
                                ${record.technician ? `<span class="me-3"><i class="fas fa-user-cog me-1"></i>${record.technician}</span>` : ''}
                                <span><i class="fas fa-clock me-1"></i>记录时间: ${new Date(record.createdAt).toLocaleDateString()}</span>
                            </div>
                            
                            ${record.notes ? `<p class="mb-0 mt-2 text-muted small"><i class="fas fa-sticky-note me-1"></i>${record.notes}</p>` : ''}
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="crm.editMaintenanceRecord('${record.id}')" title="编辑">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-info" onclick="crm.duplicateMaintenanceRecord('${record.id}')" title="复制">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="crm.deleteMaintenanceRecord('${record.id}')" title="删除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        }).join('');

        container.innerHTML = recordsHtml;
        
        // 更新车辆筛选卡片显示
        this.updateVehicleFilterCard();
    }

    renderReminders() {
        // TODO: 实现保养提醒
    }

    renderStatistics() {
        this.calculateOverallStats();
        this.renderCustomerStats();
        this.renderMaintenanceStats();
        this.renderRevenueChart();
        this.renderMaintenanceTypeChart();
        this.initializeDateFilters();
    }

    calculateOverallStats() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        // 计算本月开始和结束时间
        const thisMonthStart = new Date(currentYear, currentMonth, 1);
        const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
        
        // 基础统计
        const totalCustomers = this.customers.length;
        const totalVehicles = this.vehicles.length;
        const totalMaintenanceRecords = this.maintenanceRecords.length;
        
        // 本月新增客户
        const newCustomersThisMonth = this.customers.filter(customer => {
            const createdDate = new Date(customer.createdAt);
            return createdDate >= thisMonthStart && createdDate <= thisMonthEnd;
        }).length;
        
        // 本月维修记录
        const thisMonthRecords = this.maintenanceRecords.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate >= thisMonthStart && recordDate <= thisMonthEnd;
        }).length;
        
        // 计算营收
        const totalRevenue = this.maintenanceRecords.reduce((sum, record) => {
            return sum + (parseFloat(record.cost) || 0);
        }, 0);
        
        const thisMonthRevenue = this.maintenanceRecords
            .filter(record => {
                const recordDate = new Date(record.date);
                return recordDate >= thisMonthStart && recordDate <= thisMonthEnd;
            })
            .reduce((sum, record) => sum + (parseFloat(record.cost) || 0), 0);
        
        // 平均每客户车辆数
        const avgVehiclesPerCustomer = totalCustomers > 0 ? (totalVehicles / totalCustomers).toFixed(1) : 0;
        
        // 更新页面显示
        document.getElementById('totalCustomers').textContent = totalCustomers;
        document.getElementById('totalVehicles').textContent = totalVehicles;
        document.getElementById('totalMaintenanceRecords').textContent = totalMaintenanceRecords;
        document.getElementById('totalRevenue').textContent = `¥${totalRevenue.toFixed(2)}`;
        
        document.getElementById('newCustomersThisMonth').textContent = `本月新增: ${newCustomersThisMonth}`;
        document.getElementById('avgVehiclesPerCustomer').textContent = `平均每客户: ${avgVehiclesPerCustomer}辆`;
        document.getElementById('thisMonthRecords').textContent = `本月维修: ${thisMonthRecords}次`;
        document.getElementById('thisMonthRevenue').textContent = `本月营收: ¥${thisMonthRevenue.toFixed(2)}`;
    }

    renderCustomerStats() {
        const customerStatsTable = document.getElementById('customerStatsTable');
        
        // 客户类型统计
        const customerTypes = {};
        this.customers.forEach(customer => {
            const type = customer.type || '普通客户';
            customerTypes[type] = (customerTypes[type] || 0) + 1;
        });
        
        // 客户标签统计
        const customerTags = {};
        this.customers.forEach(customer => {
            if (customer.tags && customer.tags.length > 0) {
                customer.tags.forEach(tag => {
                    customerTags[tag] = (customerTags[tag] || 0) + 1;
                });
            }
        });
        
        // 活跃客户统计（最近3个月有维修记录）
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const activeCustomers = new Set();
        this.maintenanceRecords.forEach(record => {
            if (new Date(record.date) >= threeMonthsAgo) {
                const vehicle = this.vehicles.find(v => v.id === record.vehicleId);
                if (vehicle) {
                    activeCustomers.add(vehicle.customerId);
                }
            }
        });
        
        let html = `
            <tr><td><strong>客户类型分布</strong></td><td></td></tr>
        `;
        
        Object.entries(customerTypes).forEach(([type, count]) => {
            html += `<tr><td>${type}</td><td>${count}个</td></tr>`;
        });
        
        html += `<tr><td><strong>客户标签统计</strong></td><td></td></tr>`;
        
        if (Object.keys(customerTags).length > 0) {
            Object.entries(customerTags).forEach(([tag, count]) => {
                html += `<tr><td>${tag}</td><td>${count}个</td></tr>`;
            });
        } else {
            html += `<tr><td class="text-muted">暂无标签数据</td><td>-</td></tr>`;
        }
        
        html += `
            <tr><td><strong>活跃度分析</strong></td><td></td></tr>
            <tr><td>活跃客户（3个月内）</td><td>${activeCustomers.size}个</td></tr>
            <tr><td>活跃率</td><td>${this.customers.length > 0 ? ((activeCustomers.size / this.customers.length) * 100).toFixed(1) : 0}%</td></tr>
        `;
        
        customerStatsTable.innerHTML = html;
    }

    renderMaintenanceStats() {
        const maintenanceStatsTable = document.getElementById('maintenanceStatsTable');
        
        // 维修类型统计
        const maintenanceTypes = {};
        this.maintenanceRecords.forEach(record => {
            if (record.types && record.types.length > 0) {
                record.types.forEach(type => {
                    maintenanceTypes[type] = (maintenanceTypes[type] || 0) + 1;
                });
            }
        });
        
        // 平均维修费用
        const totalCost = this.maintenanceRecords.reduce((sum, record) => {
            return sum + (parseFloat(record.cost) || 0);
        }, 0);
        const avgCost = this.maintenanceRecords.length > 0 ? totalCost / this.maintenanceRecords.length : 0;
        
        // 技师工作量统计
        const technicianStats = {};
        this.maintenanceRecords.forEach(record => {
            if (record.technician && record.technician.trim()) {
                const tech = record.technician.trim();
                technicianStats[tech] = (technicianStats[tech] || 0) + 1;
            }
        });
        
        let html = `
            <tr><td><strong>维修类型统计</strong></td><td></td></tr>
        `;
        
        if (Object.keys(maintenanceTypes).length > 0) {
            Object.entries(maintenanceTypes)
                .sort(([,a], [,b]) => b - a)
                .forEach(([type, count]) => {
                    html += `<tr><td>${type}</td><td>${count}次</td></tr>`;
                });
        } else {
            html += `<tr><td class="text-muted">暂无维修数据</td><td>-</td></tr>`;
        }
        
        html += `
            <tr><td><strong>费用分析</strong></td><td></td></tr>
            <tr><td>平均维修费用</td><td>¥${avgCost.toFixed(2)}</td></tr>
            <tr><td>最高单次费用</td><td>¥${Math.max(...this.maintenanceRecords.map(r => parseFloat(r.cost) || 0)).toFixed(2)}</td></tr>
        `;
        
        if (Object.keys(technicianStats).length > 0) {
            html += `<tr><td><strong>技师工作量</strong></td><td></td></tr>`;
            Object.entries(technicianStats)
                .sort(([,a], [,b]) => b - a)
                .forEach(([tech, count]) => {
                    html += `<tr><td>${tech}</td><td>${count}次</td></tr>`;
                });
        }
        
        maintenanceStatsTable.innerHTML = html;
    }

    renderRevenueChart() {
        // 简化的营收趋势图表（使用文本显示）
        const chartContainer = document.getElementById('revenueChart');
        
        // 计算最近6个月的营收
        const monthlyRevenue = {};
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            monthlyRevenue[monthKey] = 0;
        }
        
        this.maintenanceRecords.forEach(record => {
            const recordDate = new Date(record.date);
            const monthKey = `${recordDate.getFullYear()}-${(recordDate.getMonth() + 1).toString().padStart(2, '0')}`;
            if (monthlyRevenue.hasOwnProperty(monthKey)) {
                monthlyRevenue[monthKey] += parseFloat(record.cost) || 0;
            }
        });
        
        let chartHtml = '<div class="text-center mt-3">';
        chartHtml += '<h6>最近6个月营收趋势</h6>';
        chartHtml += '<div class="row">';
        
        Object.entries(monthlyRevenue).forEach(([month, revenue]) => {
            chartHtml += `
                <div class="col text-center">
                    <div class="mb-2">
                        <div class="bg-primary text-white rounded p-2">
                            ¥${revenue.toFixed(0)}
                        </div>
                    </div>
                    <small>${month}</small>
                </div>
            `;
        });
        
        chartHtml += '</div></div>';
        chartContainer.innerHTML = chartHtml;
    }

    renderMaintenanceTypeChart() {
        // 简化的维修类型分布图（使用进度条显示）
        const chartContainer = document.getElementById('maintenanceTypeChart');
        
        const typeStats = {};
        this.maintenanceRecords.forEach(record => {
            if (record.types && record.types.length > 0) {
                record.types.forEach(type => {
                    typeStats[type] = (typeStats[type] || 0) + 1;
                });
            }
        });
        
        const total = Object.values(typeStats).reduce((sum, count) => sum + count, 0);
        
        let chartHtml = '<div class="mt-3">';
        chartHtml += '<h6 class="text-center">维修类型分布</h6>';
        
        if (total > 0) {
            Object.entries(typeStats)
                .sort(([,a], [,b]) => b - a)
                .forEach(([type, count]) => {
                    const percentage = ((count / total) * 100).toFixed(1);
                    chartHtml += `
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>${type}</span>
                                <span>${count}次 (${percentage}%)</span>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    `;
                });
        } else {
            chartHtml += '<div class="text-center text-muted mt-5">暂无维修数据</div>';
        }
        
        chartHtml += '</div>';
        chartContainer.innerHTML = chartHtml;
    }

    initializeDateFilters() {
        const now = new Date();
        const endDate = now.toISOString().split('T')[0];
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        
        document.getElementById('startDate').value = startDate;
        document.getElementById('endDate').value = endDate;
    }

    setDateRange(range) {
        const now = new Date();
        let startDate, endDate;
        
        switch(range) {
            case 'thisMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'lastMonth':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'thisYear':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = now;
                break;
        }
        
        document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    }

    filterStatisticsByDate() {
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        endDate.setHours(23, 59, 59, 999);
        
        if (startDate > endDate) {
            this.showToast('开始日期不能晚于结束日期', 'error');
            return;
        }
        
        // 筛选数据并重新渲染
        this.renderFilteredStats(startDate, endDate);
        this.showToast(`已筛选 ${startDate.toLocaleDateString()} 至 ${endDate.toLocaleDateString()} 的数据`, 'success');
    }

    renderFilteredStats(startDate, endDate) {
        // 筛选指定时间范围内的维修记录
        const filteredRecords = this.maintenanceRecords.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate >= startDate && recordDate <= endDate;
        });
        
        // 更新营收统计
        const filteredRevenue = filteredRecords.reduce((sum, record) => {
            return sum + (parseFloat(record.cost) || 0);
        }, 0);
        
        // 更新维修次数
        const filteredCount = filteredRecords.length;
        
        // 更新显示
        document.getElementById('totalRevenue').textContent = `¥${filteredRevenue.toFixed(2)}`;
        document.getElementById('totalMaintenanceRecords').textContent = filteredCount;
        
        // 重新渲染图表（基于筛选数据）
        this.renderFilteredCharts(filteredRecords, startDate, endDate);
    }

    renderFilteredCharts(filteredRecords, startDate, endDate) {
        // 更新维修类型分布（基于筛选数据）
        const typeStats = {};
        filteredRecords.forEach(record => {
            if (record.types && record.types.length > 0) {
                record.types.forEach(type => {
                    typeStats[type] = (typeStats[type] || 0) + 1;
                });
            }
        });
        
        const total = Object.values(typeStats).reduce((sum, count) => sum + count, 0);
        const chartContainer = document.getElementById('maintenanceTypeChart');
        
        let chartHtml = '<div class="mt-3">';
        chartHtml += `<h6 class="text-center">维修类型分布 (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})</h6>`;
        
        if (total > 0) {
            Object.entries(typeStats)
                .sort(([,a], [,b]) => b - a)
                .forEach(([type, count]) => {
                    const percentage = ((count / total) * 100).toFixed(1);
                    chartHtml += `
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>${type}</span>
                                <span>${count}次 (${percentage}%)</span>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    `;
                });
        } else {
            chartHtml += '<div class="text-center text-muted mt-5">该时间段内暂无维修数据</div>';
        }
        
        chartHtml += '</div>';
        chartContainer.innerHTML = chartHtml;
    }

    refreshStatistics() {
        this.renderStatistics();
        this.showToast('数据统计已刷新', 'success');
    }

    exportStatistics() {
        const stats = this.generateStatisticsReport();
        const csvContent = this.convertToCSV(stats);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `汽修店统计报表_${new Date().toLocaleDateString()}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('统计报表已导出', 'success');
    }

    generateStatisticsReport() {
        return {
            summary: {
                totalCustomers: this.customers.length,
                totalVehicles: this.vehicles.length,
                totalMaintenanceRecords: this.maintenanceRecords.length,
                totalRevenue: this.maintenanceRecords.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0)
            },
            customers: this.customers,
            vehicles: this.vehicles,
            maintenanceRecords: this.maintenanceRecords
        };
    }

    convertToCSV(data) {
        let csv = '汽修店CRM统计报表\n\n';
        csv += '总体统计\n';
        csv += `总客户数,${data.summary.totalCustomers}\n`;
        csv += `总车辆数,${data.summary.totalVehicles}\n`;
        csv += `总维修记录数,${data.summary.totalMaintenanceRecords}\n`;
        csv += `总营收,¥${data.summary.totalRevenue.toFixed(2)}\n\n`;
        
        csv += '维修记录明细\n';
        csv += '日期,客户姓名,车牌号,维修类型,费用,技师\n';
        
        data.maintenanceRecords.forEach(record => {
            const customer = this.customers.find(c => c.id === record.customerId);
            const vehicle = this.vehicles.find(v => v.id === record.vehicleId);
            csv += `${record.date},${customer?.name || ''},${vehicle?.plate || ''},${record.types?.join(';') || ''},¥${record.cost || 0},${record.technician || ''}\n`;
        });
        
        return csv;
    }

    // 车辆管理相关函数
    showAddVehicleModal() {
        // 检查是否有客户
        if (this.customers.length === 0) {
            this.showToast('请先添加客户，然后再添加车辆', 'warning');
            return;
        }
        
        // 清空表单
        document.getElementById('vehicleCustomer').value = '';
        document.getElementById('vehiclePlate').value = '';
        document.getElementById('vehicleBrand').value = '';
        document.getElementById('vehicleModel').value = '';
        document.getElementById('vehicleYear').value = '';
        document.getElementById('vehicleColor').value = '';
        document.getElementById('vehicleVin').value = '';
        
        // 更新客户选项
        this.updateVehicleCustomerOptions();
        
        // 如果当前在筛选某个客户，自动选中该客户
        if (this.currentFilteredCustomerId) {
            document.getElementById('vehicleCustomer').value = this.currentFilteredCustomerId;
        }
        
        // 清除验证错误
        document.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
        document.querySelectorAll('.invalid-feedback').forEach(el => {
            el.remove();
        });
        
        const modal = new bootstrap.Modal(document.getElementById('addVehicleModal'));
        modal.show();
    }
    
    updateVehicleCustomerOptions() {
        const select = document.getElementById('vehicleCustomer');
        const currentValue = select.value;
        
        // 清空现有选项
        select.innerHTML = '<option value="">请选择客户</option>';
        
        // 添加客户选项
        this.customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = `${customer.name} (${customer.phone})`;
            select.appendChild(option);
        });
        
        // 恢复之前的选择
        if (currentValue) {
            select.value = currentValue;
        }
    }
    
    saveVehicle() {
        const customerId = document.getElementById('vehicleCustomer').value;
        const plate = document.getElementById('vehiclePlate').value.trim().toUpperCase();
        const brand = document.getElementById('vehicleBrand').value.trim();
        const model = document.getElementById('vehicleModel').value.trim();
        const year = document.getElementById('vehicleYear').value;
        const color = document.getElementById('vehicleColor').value.trim();
        const vin = document.getElementById('vehicleVin').value.trim().toUpperCase();

        // 表单验证
        if (!this.validateVehicleForm(customerId, plate, brand, model)) {
            return;
        }

        // 创建车辆对象
        const vehicle = {
            id: Date.now().toString(),
            customerId: customerId,
            plate: plate,
            brand: brand,
            model: model,
            year: year || null,
            color: color || null,
            vin: vin || null,
            createdAt: new Date().toISOString()
        };

        // 保存到数组和本地存储
        this.vehicles.push(vehicle);
        this.saveToStorage('vehicles', this.vehicles);

        // 关闭模态框并刷新列表
        const modal = bootstrap.Modal.getInstance(document.getElementById('addVehicleModal'));
        modal.hide();
        this.renderVehicles();
        this.renderCustomers(); // 更新客户列表中的车辆数量

        // 显示成功消息
        const customer = this.customers.find(c => c.id === customerId);
        this.showToast(`已为 ${customer.name} 添加车辆 ${plate}`, 'success');
    }
    
    validateVehicleForm(customerId, plate, brand, model) {
        let isValid = true;

        // 清除之前的验证状态
        document.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
        document.querySelectorAll('.invalid-feedback').forEach(el => {
            el.remove();
        });

        // 验证客户选择
        if (!customerId) {
            this.showFieldError('vehicleCustomer', '请选择车辆所属客户');
            isValid = false;
        }

        // 验证车牌号
        if (!plate) {
            this.showFieldError('vehiclePlate', '请输入车牌号');
            isValid = false;
        } else if (this.vehicles.some(vehicle => vehicle.plate === plate)) {
            this.showFieldError('vehiclePlate', '该车牌号已存在');
            isValid = false;
        }

        // 验证品牌
        if (!brand) {
            this.showFieldError('vehicleBrand', '请输入车辆品牌');
            isValid = false;
        }

        // 验证型号
        if (!model) {
            this.showFieldError('vehicleModel', '请输入车辆型号');
            isValid = false;
        }

        return isValid;
    }
    
    updateCustomerFilterCard() {
        const filterCard = document.getElementById('customer-filter-card');
        const customerNameSpan = document.getElementById('filtered-customer-name');
        
        if (this.currentFilteredCustomerId) {
            const customer = this.customers.find(c => c.id === this.currentFilteredCustomerId);
            if (customer) {
                customerNameSpan.textContent = customer.name;
                filterCard.style.display = 'block';
            }
        } else {
            filterCard.style.display = 'none';
        }
    }
    
    clearCustomerFilter() {
        this.currentFilteredCustomerId = null;
        this.renderVehicles();
    }
    
    viewCustomerFromVehicle(customerId) {
        // 切换到客户管理页面并跳转到指定客户
        this.showPage('customers');
        
        // 滚动到指定客户
        setTimeout(() => {
            const customer = this.customers.find(c => c.id === customerId);
            if (customer) {
                this.showToast(`已定位到客户: ${customer.name}`, 'info');
            }
        }, 300);
    }
    
    editVehicle(vehicleId) {
        // TODO: 实现编辑功能
        this.showToast('车辆编辑功能正在开发中...', 'info');
    }
    
    deleteVehicle(vehicleId) {
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return;
        
        if (!confirm(`确定要删除车辆 ${vehicle.plate} 吗？删除后无法恢复。`)) {
            return;
        }

        this.vehicles = this.vehicles.filter(v => v.id !== vehicleId);
        this.saveToStorage('vehicles', this.vehicles);
        this.renderVehicles();
        this.renderCustomers(); // 更新客户列表中的车辆数量
        this.showToast('车辆删除成功！', 'success');
    }
    
    addMaintenanceRecord(vehicleId) {
        this.currentPreselectedVehicleId = vehicleId;
        this.showAddMaintenanceModal();
    }
    
    addMaintenanceForCurrentVehicle() {
        if (this.currentFilteredVehicleId) {
            this.currentPreselectedVehicleId = this.currentFilteredVehicleId;
            this.showAddMaintenanceModal();
        } else {
            this.showToast('没有选定的车辆', 'warning');
        }
    }
    
    viewVehicleMaintenance(vehicleId) {
        // 切换到维修记录页面并筛选该车辆
        this.currentFilteredVehicleId = vehicleId;
        
        // 切换页面
        this.showPage('maintenance');
        
        // 更新导航栏状态
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        document.querySelector('a[onclick*="maintenance"]').classList.add('active');
        
        // 显示提示
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            this.showToast(`正在查看 ${vehicle.plate} 的维修记录`, 'info');
        }
    }
    
    // 维修记录管理相关函数
    showAddMaintenanceModal() {
        // 检查是否有车辆
        if (this.vehicles.length === 0) {
            this.showToast('请先添加车辆，然后再添加维修记录', 'warning');
            return;
        }
        
        // 清除编辑状态
        this.currentEditingMaintenanceId = null;
        
        // 清空表单
        this.clearMaintenanceForm();
        
        // 设置默认日期为今天
        document.getElementById('maintenanceDate').value = new Date().toISOString().split('T')[0];
        
        // 重置模态框标题
        document.querySelector('#addMaintenanceModal .modal-title').textContent = '添加维修记录';
        
        // 更新客户选项
        this.updateMaintenanceCustomerOptions();
        
        // 设置快速输入事件
        this.setupQuickInputListeners();
        
        // 如果有预选车辆，自动选中
        if (this.currentPreselectedVehicleId) {
            const vehicle = this.vehicles.find(v => v.id === this.currentPreselectedVehicleId);
            if (vehicle) {
                document.getElementById('maintenanceCustomer').value = vehicle.customerId;
                this.updateVehicleOptions();
                document.getElementById('maintenanceVehicle').value = this.currentPreselectedVehicleId;
            }
            this.currentPreselectedVehicleId = null;
        }
        
        const modal = new bootstrap.Modal(document.getElementById('addMaintenanceModal'));
        modal.show();
    }
    
    clearMaintenanceForm() {
        document.getElementById('maintenanceCustomer').value = '';
        document.getElementById('maintenanceVehicle').value = '';
        document.getElementById('maintenanceDate').value = '';
        document.getElementById('maintenanceMileage').value = '';
        document.getElementById('maintenanceDescription').value = '';
        document.getElementById('maintenanceCost').value = '';
        document.getElementById('maintenanceTechnician').value = '';
        document.getElementById('maintenanceNotes').value = '';
        
        // 清除类型选择
        document.querySelectorAll('.maintenance-type-checkboxes input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // 清除快速输入
        document.getElementById('quickInput').value = '';
        document.getElementById('quickInputResults').style.display = 'none';
        
        // 清除验证错误
        document.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
        document.querySelectorAll('.invalid-feedback').forEach(el => {
            el.remove();
        });
    }
    
    updateMaintenanceCustomerOptions() {
        const select = document.getElementById('maintenanceCustomer');
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">请选择客户</option>';
        
        this.customers.forEach(customer => {
            const customerVehicles = this.vehicles.filter(v => v.customerId === customer.id);
            if (customerVehicles.length > 0) {
                const option = document.createElement('option');
                option.value = customer.id;
                option.textContent = `${customer.name} (${customerVehicles.length}辆车)`;
                select.appendChild(option);
            }
        });
        
        if (currentValue) {
            select.value = currentValue;
        }
    }
    
    updateVehicleOptions() {
        const customerSelect = document.getElementById('maintenanceCustomer');
        const vehicleSelect = document.getElementById('maintenanceVehicle');
        const customerId = customerSelect.value;
        
        vehicleSelect.innerHTML = customerId ? '<option value="">请选择车辆</option>' : '<option value="">请先选择客户</option>';
        
        if (customerId) {
            const customerVehicles = this.vehicles.filter(v => v.customerId === customerId);
            customerVehicles.forEach(vehicle => {
                const option = document.createElement('option');
                option.value = vehicle.id;
                option.textContent = `${vehicle.plate} (${vehicle.brand} ${vehicle.model})`;
                vehicleSelect.appendChild(option);
            });
        }
    }
    
    saveMaintenanceRecord() {
        const customerId = document.getElementById('maintenanceCustomer').value;
        const vehicleId = document.getElementById('maintenanceVehicle').value;
        const date = document.getElementById('maintenanceDate').value;
        const mileageValue = document.getElementById('maintenanceMileage').value.trim();
        const mileage = mileageValue ? parseInt(mileageValue) : null;
        const description = document.getElementById('maintenanceDescription').value.trim();
        const costValue = document.getElementById('maintenanceCost').value.trim();
        const cost = costValue ? parseFloat(costValue) : null;
        const technician = document.getElementById('maintenanceTechnician').value.trim();
        const notes = document.getElementById('maintenanceNotes').value.trim();
        
        // 获取选中的维修类型
        const types = [];
        document.querySelectorAll('.maintenance-type-checkboxes input[type="checkbox"]:checked').forEach(checkbox => {
            types.push(checkbox.value);
        });

        // 表单验证
        if (!this.validateMaintenanceForm(customerId, vehicleId, date, mileage, types)) {
            return;
        }

        if (this.currentEditingMaintenanceId) {
            // 编辑模式：更新现有记录
            const recordIndex = this.maintenanceRecords.findIndex(r => r.id === this.currentEditingMaintenanceId);
            if (recordIndex !== -1) {
                const existingRecord = this.maintenanceRecords[recordIndex];
                this.maintenanceRecords[recordIndex] = {
                    ...existingRecord, // 保留原有数据
                    vehicleId: vehicleId,
                    date: date,
                    mileage: mileage,
                    types: types,
                    description: description || null,
                    cost: cost && !isNaN(cost) ? cost : null,
                    technician: technician || null,
                    notes: notes || null,
                    updatedAt: new Date().toISOString() // 添加更新时间
                };
                
                this.showToast('维修记录更新成功！', 'success');
            }
            
            // 清除编辑状态
            this.currentEditingMaintenanceId = null;
        } else {
            // 新增模式：创建新记录
            const record = {
                id: Date.now().toString(),
                vehicleId: vehicleId,
                date: date,
                mileage: mileage,
                types: types,
                description: description || null,
                cost: cost && !isNaN(cost) ? cost : null,
                technician: technician || null,
                notes: notes || null,
                createdAt: new Date().toISOString()
            };

            this.maintenanceRecords.push(record);
            this.showToast('维修记录添加成功！', 'success');
        }

        // 保存到本地存储
        this.saveToStorage('maintenanceRecords', this.maintenanceRecords);
        
        // 更新客户的上次来店时间
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            const customer = this.customers.find(c => c.id === vehicle.customerId);
            if (customer) {
                customer.lastVisit = new Date().toISOString();
                this.saveToStorage('customers', this.customers);
            }
        }

        // 关闭模态框并刷新列表
        const modal = bootstrap.Modal.getInstance(document.getElementById('addMaintenanceModal'));
        modal.hide();
        this.renderMaintenanceRecords();
        this.renderVehicles(); // 更新车辆列表中的维修记录数量
        this.renderCustomers(); // 更新客户的上次来店时间
    }
    
    validateMaintenanceForm(customerId, vehicleId, date, mileage, types) {
        let isValid = true;

        // 清除之前的验证状态
        document.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
        document.querySelectorAll('.invalid-feedback').forEach(el => {
            el.remove();
        });

        // 验证客户选择
        if (!customerId) {
            this.showFieldError('maintenanceCustomer', '请选择客户');
            isValid = false;
        }

        // 验证车辆选择
        if (!vehicleId) {
            this.showFieldError('maintenanceVehicle', '请选择车辆');
            isValid = false;
        }

        // 验证日期
        if (!date) {
            this.showFieldError('maintenanceDate', '请选择维修日期');
            isValid = false;
        }

        // 验证公里数
        if (!mileage || isNaN(mileage) || mileage <= 0) {
            this.showFieldError('maintenanceMileage', '请输入正确的公里数');
            isValid = false;
        }

        // 验证维修类型
        if (types.length === 0) {
            this.showToast('请至少选择一种维修类型', 'warning');
            isValid = false;
        }

        return isValid;
    }
    
    updateVehicleFilterCard() {
        const filterCard = document.getElementById('vehicle-filter-card');
        const vehicleInfoSpan = document.getElementById('filtered-vehicle-info');
        
        if (this.currentFilteredVehicleId) {
            const vehicle = this.vehicles.find(v => v.id === this.currentFilteredVehicleId);
            if (vehicle) {
                const customer = this.customers.find(c => c.id === vehicle.customerId);
                const customerName = customer ? customer.name : '未知客户';
                vehicleInfoSpan.textContent = `${vehicle.plate} (${vehicle.brand} ${vehicle.model}) - ${customerName}`;
                filterCard.style.display = 'block';
            }
        } else {
            filterCard.style.display = 'none';
        }
    }
    
    clearVehicleFilter() {
        this.currentFilteredVehicleId = null;
        this.renderMaintenanceRecords();
    }
    
    viewVehicleFromMaintenance(vehicleId) {
        // 切换到车辆管理页面
        this.currentFilteredCustomerId = null; // 清除客户筛选
        this.showPage('vehicles');
        
        setTimeout(() => {
            const vehicle = this.vehicles.find(v => v.id === vehicleId);
            if (vehicle) {
                this.showToast(`已定位到车辆: ${vehicle.plate}`, 'info');
            }
        }, 300);
    }
    
    editMaintenanceRecord(recordId) {
        const record = this.maintenanceRecords.find(r => r.id === recordId);
        if (!record) {
            this.showToast('维修记录不存在', 'error');
            return;
        }

        // 设置当前编辑的维修记录ID
        this.currentEditingMaintenanceId = recordId;

        // 设置预选车辆ID，这样showAddMaintenanceModal会自动填充客户和车辆信息
        this.currentPreselectedVehicleId = record.vehicleId;

        // 直接调用showAddMaintenanceModal，它会自动处理客户和车辆预填充
        this.showAddMaintenanceModal();
        
        // 延迟填充其他数据，确保模态框已经显示和客户/车辆已经预选
        setTimeout(() => {
            // 填充其他维修记录特有的数据
            document.getElementById('maintenanceDate').value = record.date;
            document.getElementById('maintenanceMileage').value = record.mileage;
            document.getElementById('maintenanceDescription').value = record.description || '';
            document.getElementById('maintenanceCost').value = record.cost || '';
            document.getElementById('maintenanceTechnician').value = record.technician || '';
            document.getElementById('maintenanceNotes').value = record.notes || '';

            // 设置维修类型复选框
            if (record.types && record.types.length > 0) {
                record.types.forEach(type => {
                    const checkbox = document.querySelector(`input[value="${type}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            }

            // 更改模态框标题
            document.querySelector('#addMaintenanceModal .modal-title').textContent = '编辑维修记录';
        }, 200);
    }
    
    duplicateMaintenanceRecord(recordId) {
        const record = this.maintenanceRecords.find(r => r.id === recordId);
        if (!record) return;
        
        // 预设车辆并打开模态框
        this.currentPreselectedVehicleId = record.vehicleId;
        this.showAddMaintenanceModal();
        
        // 填入原有数据（除了日期和公里数）
        setTimeout(() => {
            record.types.forEach(type => {
                const checkbox = document.querySelector(`input[value="${type}"]`);
                if (checkbox) checkbox.checked = true;
            });
            
            if (record.description) document.getElementById('maintenanceDescription').value = record.description;
            if (record.technician) document.getElementById('maintenanceTechnician').value = record.technician;
            if (record.notes) document.getElementById('maintenanceNotes').value = record.notes;
        }, 100);
        
        this.showToast('已复制维修记录模板，请调整日期和公里数', 'info');
    }
    
    deleteMaintenanceRecord(recordId) {
        const record = this.maintenanceRecords.find(r => r.id === recordId);
        if (!record) return;
        
        if (!confirm('确定要删除这条维修记录吗？删除后无法恢复。')) {
            return;
        }

        this.maintenanceRecords = this.maintenanceRecords.filter(r => r.id !== recordId);
        this.saveToStorage('maintenanceRecords', this.maintenanceRecords);
        this.renderMaintenanceRecords();
        this.renderVehicles(); // 更新车辆列表中的维修记录数量
        this.showToast('维修记录删除成功！', 'success');
    }
    
    // 搜索功能
    setupSearchListeners() {
        const searchInput = document.getElementById('globalSearch');
        const searchResults = document.getElementById('searchResults');
        let searchTimeout;
        
        // 输入事件
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                this.hideSearchResults();
                return;
            }
            
            // 防抖，300ms后搜索
            searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 300);
        });
        
        // 焦点事件
        searchInput.addEventListener('focus', () => {
            const query = searchInput.value.trim();
            if (query.length >= 2) {
                this.performSearch(query);
            }
        });
        
        // 点击外部隐藏结果
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSearchResults();
            }
        });
        
        // ESC键隐藏结果
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSearchResults();
                searchInput.blur();
            }
        });
    }
    
    performSearch(query) {
        const results = {
            customers: [],
            vehicles: []
        };
        
        const lowerQuery = query.toLowerCase();
        
        // 搜索客户
        this.customers.forEach(customer => {
            let matchScore = 0;
            let matchFields = [];
            
            // 姓名匹配
            if (customer.name.toLowerCase().includes(lowerQuery)) {
                matchScore += 10;
                matchFields.push('姓名');
            }
            
            // 电话匹配
            if (customer.phone.includes(query)) {
                matchScore += 15;
                matchFields.push('电话');
            }
            
            // 地址匹配
            if (customer.address && customer.address.toLowerCase().includes(lowerQuery)) {
                matchScore += 5;
                matchFields.push('地址');
            }
            
            if (matchScore > 0) {
                results.customers.push({
                    ...customer,
                    matchScore,
                    matchFields
                });
            }
        });
        
        // 搜索车辆
        this.vehicles.forEach(vehicle => {
            let matchScore = 0;
            let matchFields = [];
            
            // 车牌匹配
            if (vehicle.plate.toLowerCase().includes(lowerQuery)) {
                matchScore += 20;
                matchFields.push('车牌');
            }
            
            // 品牌匹配
            if (vehicle.brand.toLowerCase().includes(lowerQuery)) {
                matchScore += 8;
                matchFields.push('品牌');
            }
            
            // 型号匹配
            if (vehicle.model.toLowerCase().includes(lowerQuery)) {
                matchScore += 8;
                matchFields.push('型号');
            }
            
            // 颜色匹配
            if (vehicle.color && vehicle.color.toLowerCase().includes(lowerQuery)) {
                matchScore += 5;
                matchFields.push('颜色');
            }
            
            // VIN匹配
            if (vehicle.vin && vehicle.vin.toLowerCase().includes(lowerQuery)) {
                matchScore += 10;
                matchFields.push('VIN');
            }
            
            if (matchScore > 0) {
                const customer = this.customers.find(c => c.id === vehicle.customerId);
                results.vehicles.push({
                    ...vehicle,
                    customerName: customer ? customer.name : '未知客户',
                    matchScore,
                    matchFields
                });
            }
        });
        
        // 按匹配分数排序
        results.customers.sort((a, b) => b.matchScore - a.matchScore);
        results.vehicles.sort((a, b) => b.matchScore - a.matchScore);
        
        this.displaySearchResults(results, query);
    }
    
    displaySearchResults(results, query) {
        const container = document.getElementById('searchResults');
        let html = '';
        
        // 客户结果
        if (results.customers.length > 0) {
            html += '<div class="search-results-header"><i class="fas fa-users me-1"></i>客户</div>';
            results.customers.slice(0, 5).forEach(customer => {
                const vehicleCount = this.vehicles.filter(v => v.customerId === customer.id).length;
                html += `
                    <div class="search-result-item" data-type="customer" data-id="${customer.id}">
                        <div class="search-result-title">
                            ${this.highlightText(customer.name, query)}
                            <span class="badge bg-secondary ms-2">${customer.matchFields.join(', ')}匹配</span>
                        </div>
                        <div class="search-result-subtitle">
                            <i class="fas fa-phone me-1"></i>${this.highlightText(customer.phone, query)}
                            ${customer.address ? ` | ${this.highlightText(customer.address, query)}` : ''}
                        </div>
                        <div class="search-result-meta">
                            ${vehicleCount} 辆车 | 添加于 ${new Date(customer.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                `;
            });
        }
        
        // 车辆结果
        if (results.vehicles.length > 0) {
            html += '<div class="search-results-header"><i class="fas fa-car me-1"></i>车辆</div>';
            results.vehicles.slice(0, 5).forEach(vehicle => {
                const maintenanceCount = this.maintenanceRecords.filter(r => r.vehicleId === vehicle.id).length;
                html += `
                    <div class="search-result-item" data-type="vehicle" data-id="${vehicle.id}">
                        <div class="search-result-title">
                            ${this.highlightText(vehicle.plate, query)}
                            <span class="badge bg-primary ms-2">${this.highlightText(vehicle.brand + ' ' + vehicle.model, query)}</span>
                            <span class="badge bg-secondary ms-1">${vehicle.matchFields.join(', ')}匹配</span>
                        </div>
                        <div class="search-result-subtitle">
                            <i class="fas fa-user me-1"></i>${vehicle.customerName}
                            ${vehicle.year ? ` | ${vehicle.year}年` : ''}
                            ${vehicle.color ? ` | ${this.highlightText(vehicle.color, query)}` : ''}
                        </div>
                        <div class="search-result-meta">
                            ${maintenanceCount} 次维修 | 添加于 ${new Date(vehicle.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                `;
            });
        }
        
        // 无结果
        if (results.customers.length === 0 && results.vehicles.length === 0) {
            html = '<div class="search-no-results">未找到匹配的结果</div>';
        }
        
        container.innerHTML = html;
        container.style.display = 'block';
    }
    
    highlightText(text, query) {
        if (!text || !query) return text;
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }
    
    hideSearchResults() {
        document.getElementById('searchResults').style.display = 'none';
    }
    
    
    goToCustomer(customerId) {
        this.hideSearchResults();
        document.getElementById('globalSearch').value = '';
        
        // 清除筛选
        this.currentFilteredCustomerId = null;
        this.currentFilteredVehicleId = null;
        
        // 设置高亮目标
        this.highlightTargetId = customerId;
        
        // 切换到客户页面
        this.showPage('customers');
        
        // 更新导航状态
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        document.querySelector('a[onclick*="customers"]').classList.add('active');
        
        // 显示提示并滚动到目标客户
        setTimeout(() => {
            const customer = this.customers.find(c => c.id === customerId);
            if (customer) {
                this.showToast(`已定位到客户: ${customer.name}`, 'success');
                this.scrollToTargetCustomer(customerId);
            }
        }, 300);
    }
    
    goToVehicle(vehicleId) {
        this.hideSearchResults();
        document.getElementById('globalSearch').value = '';
        
        // 清除筛选
        this.currentFilteredCustomerId = null;
        this.currentFilteredVehicleId = null;
        
        // 设置高亮目标
        this.highlightTargetVehicleId = vehicleId;
        
        // 切换到车辆页面
        this.showPage('vehicles');
        
        // 更新导航状态
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        document.querySelector('a[onclick*="vehicles"]').classList.add('active');
        
        // 显示提示并滚动到目标车辆
        setTimeout(() => {
            const vehicle = this.vehicles.find(v => v.id === vehicleId);
            if (vehicle) {
                this.showToast(`已定位到车辆: ${vehicle.plate}`, 'success');
                this.scrollToTargetVehicle(vehicleId);
            }
        }, 300);
    }

    // 滚动到目标元素函数
    scrollToTargetCustomer(customerId) {
        setTimeout(() => {
            const targetElement = document.querySelector(`[data-customer-id="${customerId}"]`);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 100);
    }
    
    scrollToTargetVehicle(vehicleId) {
        setTimeout(() => {
            const targetElement = document.querySelector(`[data-vehicle-id="${vehicleId}"]`);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 100);
    }

    // 工具函数
    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    showToast(message, type = 'info') {
        // 创建Toast提示
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} border-0`;
        toastEl.setAttribute('role', 'alert');
        
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toastEl);
        
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
        
        // 3秒后自动移除
        setTimeout(() => {
            toastEl.remove();
        }, 3000);
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1055';
        document.body.appendChild(container);
        return container;
    }

    // 快速输入功能
    setupQuickInputListeners() {
        const quickInput = document.getElementById('quickInput');
        const quickResults = document.getElementById('quickInputResults');
        const clearBtn = document.getElementById('clearQuickInput');
        
        if (!quickInput || !quickResults) return;
        
        let searchTimeout;
        
        quickInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            clearTimeout(searchTimeout);
            
            if (query.length < 2) {
                quickResults.style.display = 'none';
                return;
            }
            
            // 延迟搜索，避免频繁查询
            searchTimeout = setTimeout(() => {
                this.performQuickSearch(query);
            }, 300);
        });
        
        // 清除按钮功能
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                quickInput.value = '';
                quickResults.style.display = 'none';
                quickInput.focus();
            });
        }
        
        // 点击结果选择客户车辆
        quickResults.addEventListener('click', (e) => {
            const item = e.target.closest('.quick-result-item');
            if (item) {
                const customerId = item.dataset.customerId;
                const vehicleId = item.dataset.vehicleId;
                
                if (customerId && vehicleId) {
                    this.selectQuickInputResult(customerId, vehicleId);
                }
            }
            
            // 点击新增客户
            const addNewBtn = e.target.closest('.add-new-customer-btn');
            if (addNewBtn) {
                const query = quickInput.value.trim();
                this.createNewCustomerFromQuickInput(query);
            }
        });
        
        // 点击外部隐藏结果
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.quick-input-section')) {
                quickResults.style.display = 'none';
            }
        });
    }
    
    performQuickSearch(query) {
        const results = {
            matches: []
        };
        
        // 搜索客户手机号
        this.customers.forEach(customer => {
            if (customer.phone && customer.phone.includes(query)) {
                // 获取该客户的所有车辆
                const customerVehicles = this.vehicles.filter(v => v.customerId === customer.id);
                customerVehicles.forEach(vehicle => {
                    results.matches.push({
                        type: 'customer-phone',
                        customer: customer,
                        vehicle: vehicle,
                        matchText: customer.phone
                    });
                });
            }
        });
        
        // 搜索车牌号
        this.vehicles.forEach(vehicle => {
            if (vehicle.plate && vehicle.plate.toLowerCase().includes(query.toLowerCase())) {
                const customer = this.customers.find(c => c.id === vehicle.customerId);
                if (customer) {
                    results.matches.push({
                        type: 'vehicle-plate',
                        customer: customer,
                        vehicle: vehicle,
                        matchText: vehicle.plate
                    });
                }
            }
        });
        
        this.displayQuickSearchResults(results, query);
    }
    
    displayQuickSearchResults(results, query) {
        const container = document.getElementById('quickInputResults');
        let html = '';
        
        if (results.matches.length > 0) {
            results.matches.forEach(match => {
                const highlightedText = this.highlightText(match.matchText, query);
                html += `
                    <div class="quick-result-item" data-customer-id="${match.customer.id}" data-vehicle-id="${match.vehicle.id}">
                        <div class="quick-result-title">
                            ${match.customer.name} - ${match.vehicle.brand} ${match.vehicle.model}
                        </div>
                        <div class="quick-result-subtitle">
                            <i class="fas fa-phone me-1"></i>${highlightedText}
                            <span class="ms-2"><i class="fas fa-car me-1"></i>${match.vehicle.plate}</span>
                        </div>
                    </div>
                `;
            });
        } else {
            html = `
                <div class="no-results-found">
                    未找到匹配的客户或车辆
                </div>
                <div class="add-new-customer-btn">
                    <i class="fas fa-plus me-2"></i>新增客户: ${query}
                </div>
            `;
        }
        
        container.innerHTML = html;
        container.style.display = 'block';
    }
    
    selectQuickInputResult(customerId, vehicleId) {
        // 自动填充客户和车辆选项
        document.getElementById('maintenanceCustomer').value = customerId;
        this.updateVehicleOptions();
        document.getElementById('maintenanceVehicle').value = vehicleId;
        
        // 清空快速输入框和结果
        document.getElementById('quickInput').value = '';
        document.getElementById('quickInputResults').style.display = 'none';
        
        // 聚焦到下一个输入框
        setTimeout(() => {
            document.getElementById('maintenanceMileage').focus();
        }, 100);
        
        // 显示成功提示
        const customer = this.customers.find(c => c.id === customerId);
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (customer && vehicle) {
            this.showToast(`已选择: ${customer.name} - ${vehicle.plate}`, 'success');
        }
    }
    
    createNewCustomerFromQuickInput(query) {
        // 隐藏维修记录模态框
        const maintenanceModal = bootstrap.Modal.getInstance(document.getElementById('addMaintenanceModal'));
        if (maintenanceModal) {
            maintenanceModal.hide();
        }
        
        // 预填充手机号码（如果输入的是手机号格式）
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (phoneRegex.test(query)) {
            document.getElementById('customerPhone').value = query;
        }
        
        // 显示新增客户模态框
        setTimeout(() => {
            this.showAddCustomerModal();
        }, 300);
        
        this.showToast('请完善新客户信息', 'info');
    }

    // 保养提醒系统
    renderReminders() {
        const reminders = this.calculateMaintenanceReminders();
        this.updateReminderStats(reminders);
        this.displayReminders(reminders, 'all');
    }

    calculateMaintenanceReminders() {
        const reminders = [];
        
        this.vehicles.forEach(vehicle => {
            const customer = this.customers.find(c => c.id === vehicle.customerId);
            if (!customer) return;

            // 获取该车的维修记录
            const allVehicleRecords = this.maintenanceRecords
                .filter(record => record.vehicleId === vehicle.id)
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            // 筛选出包含机油更换的维修记录
            const oilChangeRecords = allVehicleRecords
                .filter(record => record.types && record.types.includes('换机油'));

            if (allVehicleRecords.length === 0) {
                // 没有维修记录的车辆，建议首次保养
                reminders.push({
                    vehicleId: vehicle.id,
                    customerId: customer.id,
                    customerName: customer.name,
                    vehiclePlate: vehicle.plate,
                    vehicleInfo: `${vehicle.brand} ${vehicle.model}`,
                    type: 'first_maintenance',
                    priority: 'normal',
                    message: '建议进行首次保养检查',
                    daysOverdue: 0,
                    kmOverdue: 0,
                    lastMaintenance: null,
                    currentMileage: 0
                });
                return;
            }

            if (oilChangeRecords.length === 0) {
                // 没有机油更换记录，但有其他维修记录，建议首次换机油
                reminders.push({
                    vehicleId: vehicle.id,
                    customerId: customer.id,
                    customerName: customer.name,
                    vehiclePlate: vehicle.plate,
                    vehicleInfo: `${vehicle.brand} ${vehicle.model}`,
                    type: 'first_oil_change',
                    priority: 'warning',
                    message: '建议进行首次机油更换',
                    daysOverdue: 0,
                    kmOverdue: 0,
                    lastMaintenance: null,
                    currentMileage: allVehicleRecords[0]?.mileage || 0
                });
                return;
            }

            // 计算基于机油更换记录的保养提醒
            const lastOilChange = oilChangeRecords[0];
            const lastMileage = lastOilChange.mileage;
            
            // 计算距离上次机油更换的时间
            const daysSinceLastOilChange = Math.floor((new Date() - new Date(lastOilChange.date)) / (1000 * 60 * 60 * 24));
            const monthsSinceLastOilChange = daysSinceLastOilChange / 30;
            
            // 保养间隔标准：每5000公里或6个月
            const kmMaintenanceInterval = 5000;
            const monthMaintenanceInterval = 6;
            
            // 方法1：检查机油更换记录间的公里数差异
            let needsMaintenanceByKm = false;
            let kmOverdueByRecords = 0;
            
            if (oilChangeRecords.length > 1) {
                // 查找最近的两次机油更换记录
                for (let i = 0; i < oilChangeRecords.length - 1; i++) {
                    const currentRecord = oilChangeRecords[i];
                    const previousRecord = oilChangeRecords[i + 1];
                    const kmDiff = currentRecord.mileage - previousRecord.mileage;
                    
                    if (kmDiff >= kmMaintenanceInterval) {
                        needsMaintenanceByKm = true;
                        kmOverdueByRecords = Math.max(kmOverdueByRecords, kmDiff - kmMaintenanceInterval);
                    }
                }
            }
            
            // 方法2：基于时间判断
            const needsMaintenanceByTime = monthsSinceLastOilChange >= monthMaintenanceInterval;
            
            // 方法3：估算当前公里数（作为补充）
            const avgKmPerDay = oilChangeRecords.length > 1 ? 
                (oilChangeRecords[0].mileage - oilChangeRecords[oilChangeRecords.length - 1].mileage) / 
                Math.max(1, Math.floor((new Date(oilChangeRecords[0].date) - new Date(oilChangeRecords[oilChangeRecords.length - 1].date)) / (1000 * 60 * 60 * 24))) 
                : 50;
            const estimatedCurrentMileage = lastMileage + (avgKmPerDay * daysSinceLastOilChange);
            const kmSinceLastOilChange = estimatedCurrentMileage - lastMileage;
            const needsMaintenanceByEstimate = kmSinceLastOilChange >= kmMaintenanceInterval;

            let priority = 'normal';
            let message = '';
            let kmOverdue = 0;
            let daysOverdue = 0;

            // 判断是否需要保养（满足任一条件即可）
            if (needsMaintenanceByKm || needsMaintenanceByTime || needsMaintenanceByEstimate) {
                // 计算超期情况
                kmOverdue = Math.max(
                    kmOverdueByRecords,
                    Math.max(0, kmSinceLastOilChange - kmMaintenanceInterval)
                );
                daysOverdue = Math.max(0, daysSinceLastOilChange - (monthMaintenanceInterval * 30));

                // 确定优先级和消息
                if (needsMaintenanceByKm && kmOverdueByRecords > 2000) {
                    priority = 'urgent';
                    message = `严重超期换油！上次换油已行驶 ${Math.floor(kmOverdueByRecords + kmMaintenanceInterval)}公里`;
                } else if (kmSinceLastOilChange >= kmMaintenanceInterval + 2000 || monthsSinceLastOilChange >= monthMaintenanceInterval + 2) {
                    priority = 'urgent';
                    message = `严重超期换油！已超期 ${Math.floor(kmOverdue)}公里 或 ${Math.floor(daysOverdue)}天`;
                } else if (needsMaintenanceByKm && kmOverdueByRecords > 1000) {
                    priority = 'warning';
                    message = `换油超期！上次换油已行驶 ${Math.floor(kmOverdueByRecords + kmMaintenanceInterval)}公里`;
                } else if (kmSinceLastOilChange >= kmMaintenanceInterval + 1000 || monthsSinceLastOilChange >= monthMaintenanceInterval + 1) {
                    priority = 'warning';
                    message = `换油超期，建议尽快更换！已超期 ${Math.floor(kmOverdue)}公里 或 ${Math.floor(daysOverdue)}天`;
                } else {
                    priority = 'warning';
                    message = `该换机油了！建议进行定期保养`;
                }

                reminders.push({
                    vehicleId: vehicle.id,
                    customerId: customer.id,
                    customerName: customer.name,
                    vehiclePlate: vehicle.plate,
                    vehicleInfo: `${vehicle.brand} ${vehicle.model}`,
                    type: 'oil_change_reminder',
                    priority: priority,
                    message: message,
                    daysOverdue: Math.floor(daysOverdue),
                    kmOverdue: Math.floor(kmOverdue),
                    lastMaintenance: lastOilChange.date,
                    currentMileage: Math.floor(estimatedCurrentMileage),
                    lastRecordMileage: lastMileage,
                    avgKmPerDay: Math.floor(avgKmPerDay)
                });
            }
        });

        return reminders.sort((a, b) => {
            const priorityOrder = { urgent: 3, warning: 2, normal: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    updateReminderStats(reminders) {
        const stats = {
            urgent: reminders.filter(r => r.priority === 'urgent').length,
            warning: reminders.filter(r => r.priority === 'warning').length,
            normal: reminders.filter(r => r.priority === 'normal').length,
            total: this.vehicles.length
        };

        document.getElementById('urgentCount').textContent = stats.urgent;
        document.getElementById('warningCount').textContent = stats.warning;
        document.getElementById('normalCount').textContent = stats.normal;
        document.getElementById('totalVehicles').textContent = stats.total;
    }

    displayReminders(reminders, filter = 'all') {
        const container = document.getElementById('remindersList');
        let filteredReminders = reminders;

        if (filter !== 'all') {
            filteredReminders = reminders.filter(r => r.priority === filter);
        }

        if (filteredReminders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <h5>没有${filter === 'all' ? '' : this.getPriorityText(filter)}保养提醒</h5>
                    <p>所有车辆保养状态良好</p>
                </div>
            `;
            return;
        }

        let html = '';
        filteredReminders.forEach(reminder => {
            const priorityClass = this.getPriorityClass(reminder.priority);
            const priorityIcon = this.getPriorityIcon(reminder.priority);
            
            html += `
                <div class="card mb-3 border-${priorityClass}">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-1 text-center">
                                <i class="fas ${priorityIcon} fa-2x text-${priorityClass}"></i>
                            </div>
                            <div class="col-md-7">
                                <h5 class="card-title mb-1">
                                    ${reminder.customerName} - ${reminder.vehiclePlate}
                                </h5>
                                <p class="card-text text-muted mb-1">${reminder.vehicleInfo}</p>
                                <p class="card-text">
                                    <strong class="text-${priorityClass}">${reminder.message}</strong>
                                </p>
                                ${reminder.lastMaintenance ? `
                                    <small class="text-muted">
                                        上次保养：${new Date(reminder.lastMaintenance).toLocaleDateString()} 
                                        (${reminder.lastRecordMileage}公里)
                                        ${reminder.currentMileage ? ` | 预估当前：${reminder.currentMileage}公里` : ''}
                                    </small>
                                ` : ''}
                            </div>
                            <div class="col-md-4 text-end">
                                <div class="btn-group-vertical">
                                    <button class="btn btn-sm btn-outline-primary mb-1" 
                                            onclick="crm.addMaintenanceForVehicle('${reminder.vehicleId}')" 
                                            title="添加保养记录">
                                        <i class="fas fa-plus me-1"></i>添加保养
                                    </button>
                                    <button class="btn btn-sm btn-outline-info" 
                                            onclick="crm.viewVehicleHistory('${reminder.vehicleId}')" 
                                            title="查看历史记录">
                                        <i class="fas fa-history me-1"></i>查看历史
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    getPriorityClass(priority) {
        switch(priority) {
            case 'urgent': return 'danger';
            case 'warning': return 'warning';
            case 'normal': return 'info';
            default: return 'secondary';
        }
    }

    getPriorityIcon(priority) {
        switch(priority) {
            case 'urgent': return 'fa-exclamation-triangle';
            case 'warning': return 'fa-exclamation-circle';
            case 'normal': return 'fa-info-circle';
            default: return 'fa-bell';
        }
    }

    getPriorityText(priority) {
        switch(priority) {
            case 'urgent': return '紧急';
            case 'warning': return '即将到期';
            case 'normal': return '正常';
            default: return '';
        }
    }

    filterReminders(filter) {
        const reminders = this.calculateMaintenanceReminders();
        this.displayReminders(reminders, filter);
    }

    refreshReminders() {
        this.renderReminders();
        this.showToast('保养提醒已刷新', 'success');
    }

    // 消息提醒系统
    renderNotifications() {
        this.updateNotificationStats();
        this.renderCustomerNotificationsList();
        this.setupNotificationEventListeners();
    }

    updateNotificationStats() {
        const enabledCustomers = this.customers.filter(c => 
            c.notifications && (c.notifications.wechat || c.notifications.sms)
        ).length;
        
        const wechatEnabled = this.customers.filter(c => 
            c.notifications && c.notifications.wechat && c.wechat
        ).length;
        
        const pendingReminders = this.calculateMaintenanceReminders().length;
        
        // 模拟今日已发送数量
        const notificationSettings = JSON.parse(localStorage.getItem('notificationSettings')) || {};
        const todayKey = new Date().toDateString();
        const todayCount = notificationSettings[`sent_${todayKey}`] || 0;
        
        document.getElementById('enabledCustomersCount').textContent = enabledCustomers;
        document.getElementById('totalNotificationsCount').textContent = todayCount;
        document.getElementById('pendingNotificationsCount').textContent = pendingReminders;
        document.getElementById('wechatEnabledCount').textContent = wechatEnabled;
    }

    renderCustomerNotificationsList() {
        const container = document.getElementById('customerNotificationsList');
        
        if (this.customers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h5>暂无客户</h5>
                    <p>请先添加客户后再设置消息提醒</p>
                </div>
            `;
            return;
        }

        let html = '';
        this.customers.forEach(customer => {
            const vehicleCount = this.vehicles.filter(v => v.customerId === customer.id).length;
            const wechatEnabled = customer.notifications?.wechat || false;
            const smsEnabled = customer.notifications?.sms || false;
            const hasWechat = customer.wechat && customer.wechat.trim() !== '';
            
            html += `
                <div class="customer-notification-card mb-3 p-3 border rounded">
                    <div class="row align-items-center">
                        <div class="col-md-4">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-user text-primary me-2"></i>
                                <div>
                                    <h6 class="mb-0">${customer.name}</h6>
                                    <small class="text-muted">${customer.phone}</small>
                                    ${vehicleCount > 0 ? `<span class="badge bg-info ms-2">${vehicleCount}辆车</span>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="mb-2">
                                <label class="form-label small">微信号</label>
                                <input type="text" class="form-control form-control-sm" 
                                       value="${customer.wechat || ''}" 
                                       onchange="crm.updateCustomerWechat('${customer.id}', this.value)"
                                       placeholder="请输入微信号">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" 
                                       id="wechat_${customer.id}" 
                                       ${wechatEnabled ? 'checked' : ''}
                                       onchange="crm.updateCustomerNotification('${customer.id}', 'wechat', this.checked)">
                                <label class="form-check-label small" for="wechat_${customer.id}">
                                    <i class="fab fa-weixin text-success me-1"></i>微信提醒
                                </label>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" 
                                       id="sms_${customer.id}" 
                                       ${smsEnabled ? 'checked' : ''}
                                       onchange="crm.updateCustomerNotification('${customer.id}', 'sms', this.checked)">
                                <label class="form-check-label small" for="sms_${customer.id}">
                                    <i class="fas fa-sms text-info me-1"></i>短信提醒
                                </label>
                            </div>
                        </div>
                        <div class="col-md-2 text-end">
                            <div class="btn-group-vertical btn-group-sm">
                                ${hasWechat && wechatEnabled ? `
                                    <button class="btn btn-outline-success btn-sm mb-1" 
                                            onclick="crm.testCustomerNotification('${customer.id}', 'wechat')"
                                            title="测试微信发送">
                                        <i class="fab fa-weixin me-1"></i>测试
                                    </button>
                                ` : ''}
                                ${smsEnabled ? `
                                    <button class="btn btn-outline-info btn-sm" 
                                            onclick="crm.testCustomerNotification('${customer.id}', 'sms')"
                                            title="测试短信发送">
                                        <i class="fas fa-sms me-1"></i>测试
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    setupNotificationEventListeners() {
        // 加载全局设置
        const settings = JSON.parse(localStorage.getItem('globalNotificationSettings')) || {
            enabled: true,
            wechatEnabled: true,
            smsEnabled: false,
            time: '09:00',
            advanceDays: 3
        };

        document.getElementById('enableGlobalNotifications').checked = settings.enabled;
        document.getElementById('enableWechatNotifications').checked = settings.wechatEnabled;
        document.getElementById('enableSmsNotifications').checked = settings.smsEnabled;
        document.getElementById('notificationTime').value = settings.time;
        document.getElementById('advanceDays').value = settings.advanceDays;

        // 客户筛选事件
        document.querySelectorAll('input[name="customerFilter"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.filterCustomerNotifications(radio.value);
            });
        });
    }

    updateCustomerWechat(customerId, wechat) {
        const customerIndex = this.customers.findIndex(c => c.id === customerId);
        if (customerIndex !== -1) {
            this.customers[customerIndex].wechat = wechat.trim();
            this.saveToStorage('customers', this.customers);
            
            // 如果有微信号，自动启用微信提醒
            if (wechat.trim() && !this.customers[customerIndex].notifications?.wechat) {
                this.updateCustomerNotification(customerId, 'wechat', true);
            }
        }
    }

    updateCustomerNotification(customerId, type, enabled) {
        const customerIndex = this.customers.findIndex(c => c.id === customerId);
        if (customerIndex !== -1) {
            if (!this.customers[customerIndex].notifications) {
                this.customers[customerIndex].notifications = { wechat: false, sms: false };
            }
            this.customers[customerIndex].notifications[type] = enabled;
            this.saveToStorage('customers', this.customers);
            this.updateNotificationStats();
        }
    }

    saveGlobalNotificationSettings() {
        const settings = {
            enabled: document.getElementById('enableGlobalNotifications').checked,
            wechatEnabled: document.getElementById('enableWechatNotifications').checked,
            smsEnabled: document.getElementById('enableSmsNotifications').checked,
            time: document.getElementById('notificationTime').value,
            advanceDays: parseInt(document.getElementById('advanceDays').value)
        };

        localStorage.setItem('globalNotificationSettings', JSON.stringify(settings));
        this.showToast('全局设置已保存', 'success');
    }

    testCustomerNotification(customerId, type) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return;

        // 模拟发送
        const message = `【汽修店保养提醒】尊敬的${customer.name}，您的爱车该保养了！请及时联系我们安排保养服务。`;
        
        if (type === 'wechat') {
            this.simulateWechatSend(customer.wechat, message);
        } else if (type === 'sms') {
            this.simulateSMSSend(customer.phone, message);
        }
    }

    testNotifications() {
        const reminders = this.calculateMaintenanceReminders();
        
        if (reminders.length === 0) {
            this.showToast('当前没有需要发送的保养提醒', 'info');
            return;
        }

        let sentCount = 0;
        reminders.forEach(reminder => {
            const customer = this.customers.find(c => c.id === reminder.customerId);
            if (customer && customer.notifications) {
                if (customer.notifications.wechat && customer.wechat) {
                    this.simulateWechatSend(customer.wechat, 
                        `【汽修店保养提醒】尊敬的${customer.name}，您的${reminder.vehiclePlate}该保养了！${reminder.message}`);
                    sentCount++;
                }
                if (customer.notifications.sms) {
                    this.simulateSMSSend(customer.phone, 
                        `【汽修店保养提醒】尊敬的${customer.name}，您的${reminder.vehiclePlate}该保养了！${reminder.message}`);
                    sentCount++;
                }
            }
        });

        this.showToast(`测试发送完成，共发送${sentCount}条消息`, 'success');
        this.updateTodayNotificationCount(sentCount);
    }

    simulateWechatSend(wechatId, message) {
        console.log('微信发送模拟：');
        console.log('接收方：', wechatId);
        console.log('消息内容：', message);
        console.log('发送状态：成功');
        
        // 在实际应用中，这里会调用微信API
        // 例如：await wechatAPI.sendMessage(wechatId, message);
    }

    simulateSMSSend(phone, message) {
        console.log('短信发送模拟：');
        console.log('接收方：', phone);
        console.log('消息内容：', message);
        console.log('发送状态：成功');
        
        // TODO: 短信通知 - 阿里云短信服务集成
        // 需要准备的资料：
        // 1. 营业执照（个体工商户或企业）
        // 2. 法人身份证正反面  
        // 3. 企业邮箱和手机号
        // 
        // 开通步骤：
        // 1. 注册阿里云账号：https://www.aliyun.com
        // 2. 完成实名认证（1-3个工作日）
        // 3. 开通短信服务（免费）
        // 4. 申请签名：【汽修店名称】
        // 5. 申请模板：保养提醒通知
        // 6. 获取API密钥：AccessKeyId和AccessKeySecret
        // 
        // 费用：0.045元/条，无月租费
        // 
        // 集成代码示例：
        // const SMSClient = require('@alicloud/sms-sdk');
        // const client = new SMSClient({
        //     accessKeyId: 'your-access-key-id',
        //     accessKeySecret: 'your-access-key-secret'
        // });
        // 
        // await client.sendSMS({
        //     PhoneNumbers: phone,
        //     SignName: '汽修店名称',
        //     TemplateCode: 'SMS_xxxxxx',
        //     TemplateParam: JSON.stringify({
        //         name: '客户姓名',
        //         vehicle: '车牌号',
        //         message: message,
        //         phone: '店铺电话'
        //     })
        // });
    }

    updateTodayNotificationCount(count) {
        const settings = JSON.parse(localStorage.getItem('notificationSettings')) || {};
        const todayKey = new Date().toDateString();
        settings[`sent_${todayKey}`] = (settings[`sent_${todayKey}`] || 0) + count;
        localStorage.setItem('notificationSettings', JSON.stringify(settings));
        this.updateNotificationStats();
    }

    filterCustomerNotifications(filter) {
        const cards = document.querySelectorAll('.customer-notification-card');
        
        cards.forEach(card => {
            const wechatCheckbox = card.querySelector('input[id^="wechat_"]');
            const smsCheckbox = card.querySelector('input[id^="sms_"]');
            
            let shouldShow = true;
            
            if (filter === 'enabled') {
                shouldShow = (wechatCheckbox && wechatCheckbox.checked) || 
                            (smsCheckbox && smsCheckbox.checked);
            } else if (filter === 'disabled') {
                shouldShow = (!wechatCheckbox || !wechatCheckbox.checked) && 
                            (!smsCheckbox || !smsCheckbox.checked);
            }
            
            card.style.display = shouldShow ? 'block' : 'none';
        });
    }

    refreshNotificationSettings() {
        this.renderNotifications();
        this.showToast('消息设置已刷新', 'success');
    }

    addMaintenanceForVehicle(vehicleId) {
        this.currentPreselectedVehicleId = vehicleId;
        this.showAddMaintenanceModal();
    }

    viewVehicleHistory(vehicleId) {
        // 切换到维修记录页面并筛选该车辆
        this.currentFilteredVehicleId = vehicleId;
        this.showPage('maintenance');
        
        // 更新导航状态
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        document.querySelector('a[onclick*="maintenance"]').classList.add('active');
        
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            this.showToast(`正在查看 ${vehicle.plate} 的维修历史`, 'info');
        }
    }
}

// 全局变量和函数
let crm;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    crm = new CarRepairCRM();
});

// 全局函数，供HTML调用
function showPage(pageId) {
    crm.showPage(pageId);
}

function showAddCustomerModal() {
    crm.showAddCustomerModal();
}

function saveCustomer() {
    crm.saveCustomer();
}

function showAddVehicleModal() {
    crm.showAddVehicleModal();
}

function saveVehicle() {
    crm.saveVehicle();
}

function clearCustomerFilter() {
    crm.clearCustomerFilter();
}

function showAddMaintenanceModal() {
    crm.showAddMaintenanceModal();
}

function saveMaintenanceRecord() {
    crm.saveMaintenanceRecord();
}

function updateVehicleOptions() {
    crm.updateVehicleOptions();
}

function clearVehicleFilter() {
    crm.clearVehicleFilter();
}

function addMaintenanceForCurrentVehicle() {
    crm.addMaintenanceForCurrentVehicle();
}

function refreshReminders() {
    crm.refreshReminders();
}