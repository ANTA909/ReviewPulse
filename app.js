class ReviewPulseVisualization {
    constructor() {
        this.apiBase = 'http://localhost:5000/api';
        this.currentProduct = null;
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.setupEventListeners();
    }

    async loadProducts() {
        try {
            const response = await fetch(`${this.apiBase}/products`);
            const products = await response.json();
            
            const select = document.getElementById('product-select');
            select.innerHTML = '<option value="">请选择商品</option>';
            
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.asin;
                option.textContent = `商品 ${product.asin} (${product.total_reviews} 条评论)`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('加载商品列表失败:', error);
        }
    }

    setupEventListeners() {
        document.getElementById('product-select').addEventListener('change', (e) => {
            this.currentProduct = e.target.value;
            if (this.currentProduct) {
                this.loadProductData();
            }
        });
    }

    async loadProductData() {
        if (!this.currentProduct) return;

        // 显示加载状态
        this.showLoading();

        try {
            const [sentimentData, timelineData, keywordsData] = await Promise.all([
                fetch(`${this.apiBase}/product/${this.currentProduct}/sentiment`).then(r => r.json()),
                fetch(`${this.apiBase}/product/${this.currentProduct}/timeline`).then(r => r.json()),
                fetch(`${this.apiBase}/product/${this.currentProduct}/keywords`).then(r => r.json())
            ]);

            console.log('情感数据:', sentimentData);
            console.log('时间线数据:', timelineData);
            console.log('关键词数据:', keywordsData);

            this.renderSentimentChart(sentimentData);
            this.renderTimelineChart(timelineData);
            this.renderWordCloud(keywordsData);
        } catch (error) {
            console.error('加载商品数据失败:', error);
            this.showError('加载数据失败，请检查API服务是否正常运行');
        }
    }

    showLoading() {
        document.getElementById('sentiment-chart').innerHTML = '<div class="loading">加载中...</div>';
        document.getElementById('timeline-chart').innerHTML = '<div class="loading">加载中...</div>';
        document.getElementById('wordcloud').innerHTML = '<div class="loading">加载中...</div>';
    }

    showError(message) {
        document.getElementById('sentiment-chart').innerHTML = `<div class="loading" style="color: red;">${message}</div>`;
        document.getElementById('timeline-chart').innerHTML = `<div class="loading" style="color: red;">${message}</div>`;
        document.getElementById('wordcloud').innerHTML = `<div class="loading" style="color: red;">${message}</div>`;
    }

    renderSentimentChart(data) {
        const container = d3.select('#sentiment-chart');
        container.html('');

        if (!data || !data.sentiment_distribution) {
            container.html('<div class="loading">暂无情感数据</div>');
            return;
        }

        const width = 600;
        const height = 400;
        const margin = { top: 40, right: 30, bottom: 50, left: 60 };

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);

        const x = d3.scaleBand()
            .domain(data.sentiment_distribution.map(d => d.sentiment))
            .range([margin.left, width - margin.right])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data.sentiment_distribution, d => d.count)])
            .nice()
            .range([height - margin.bottom, margin.top]);

        // 颜色映射
        const colorScale = d3.scaleOrdinal()
            .domain(['positive', 'negative', 'neutral'])
            .range(['#4CAF50', '#F44336', '#FFC107']);

        // 绘制柱状图
        svg.selectAll('rect')
            .data(data.sentiment_distribution)
            .join('rect')
            .attr('x', d => x(d.sentiment))
            .attr('y', d => y(d.count))
            .attr('height', d => y(0) - y(d.count))
            .attr('width', x.bandwidth())
            .attr('fill', d => colorScale(d.sentiment))
            .attr('rx', 3)
            .on('mouseover', function(event, d) {
                d3.select('.sentiment-tooltip').remove();
                
                const tooltip = d3.select('body')
                    .append('div')
                    .attr('class', 'tooltip sentiment-tooltip')
                    .style('opacity', 0);
                
                tooltip.html(`${d.sentiment}: ${d.count} 条评论`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px')
                    .transition()
                    .duration(200)
                    .style('opacity', 1);
            })
            .on('mouseout', function() {
                d3.select('.sentiment-tooltip').remove();
            });

        // 添加坐标轴
        const xAxis = g => g
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x));

        const yAxis = g => g
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));

        svg.append('g').call(xAxis);
        svg.append('g').call(yAxis);

        // 添加标题和标签
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', margin.top / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text(`商品 ${data.asin} 情感分布`);

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height - 10)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('情感类型');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 15)
            .attr('x', -height / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('评论数量');
    }

    renderTimelineChart(data) {
        const container = d3.select('#timeline-chart');
        container.html('');

        // 检查数据
        if (!data || data.length === 0) {
            container.html('<div class="loading">暂无时间线数据</div>');
            return;
        }

        console.log('时间线数据:', data);

        const width = 800;
        const height = 400;
        const margin = { top: 40, right: 30, bottom: 50, left: 60 };

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);

        // 处理日期格式 "02 24, 2015" -> Date对象
        const parseDate = (dateStr) => {
            try {
                // 处理 "MM DD, YYYY" 格式
                const parts = dateStr.split(' ');
                if (parts.length >= 3) {
                    const month = parseInt(parts[0]) - 1; // JS月份从0开始
                    const day = parseInt(parts[1].replace(',', ''));
                    const year = parseInt(parts[2]);
                    return new Date(year, month, day);
                }
                return new Date(dateStr); // 尝试默认解析
            } catch (e) {
                console.warn(`日期解析失败: ${dateStr}`, e);
                return new Date(); // 返回当前日期作为fallback
            }
        };

        // 数据预处理
        const processedData = data.map((d, i) => {
            let polarityValue = typeof d.polarity === 'number' ? d.polarity : parseFloat(d.polarity) || 0;
            polarityValue = Math.max(-1, Math.min(1, polarityValue));
            
            const dateObj = parseDate(d.date);
            
            return {
                index: i,
                polarity: polarityValue,
                sentiment: d.sentiment || 'neutral',
                text: d.text || '无评论内容',
                date: d.date,
                dateObj: dateObj,
                timestamp: dateObj.getTime()
            };
        });

        // 按时间排序
        processedData.sort((a, b) => a.timestamp - b.timestamp);

        console.log('处理后的时间线数据:', processedData);

        // 创建比例尺 - 使用实际日期
        const x = d3.scaleTime()
            .domain(d3.extent(processedData, d => d.dateObj))
            .range([margin.left, width - margin.right])
            .nice();

        const y = d3.scaleLinear()
            .domain([-1, 1])
            .range([height - margin.bottom, margin.top]);

        // 创建折线生成器
        const line = d3.line()
            .x(d => x(d.dateObj))
            .y(d => y(d.polarity))
            .curve(d3.curveMonotoneX);

        // 绘制折线
        svg.append('path')
            .datum(processedData)
            .attr('fill', 'none')
            .attr('stroke', '#4A90E2')
            .attr('stroke-width', 3)
            .attr('d', line);

        // 绘制数据点
        svg.selectAll('.data-point')
            .data(processedData)
            .enter()
            .append('circle')
            .attr('class', 'data-point')
            .attr('cx', d => x(d.dateObj))
            .attr('cy', d => y(d.polarity))
            .attr('r', 5)
            .attr('fill', d => {
                if (d.polarity > 0.1) return '#4CAF50';
                if (d.polarity < -0.1) return '#F44336';
                return '#FFC107';
            })
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .on('mouseover', function(event, d) {
                d3.select('.timeline-tooltip').remove();
                
                const tooltip = d3.select('body')
                    .append('div')
                    .attr('class', 'tooltip timeline-tooltip')
                    .style('opacity', 0);
                
                tooltip.html(`
                    <div><strong>日期:</strong> ${d.date}</div>
                    <div><strong>情感:</strong> ${d.sentiment}</div>
                    <div><strong>极性:</strong> ${d.polarity.toFixed(3)}</div>
                    <div><strong>评论:</strong> ${d.text}</div>
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 120) + 'px')
                .transition()
                .duration(200)
                .style('opacity', 1);
                
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 8);
            })
            .on('mouseout', function() {
                d3.select('.timeline-tooltip').remove();
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 5);
            });

        // 添加X轴
        const xAxis = g => g
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x)
                .ticks(6)
                .tickFormat(d3.timeFormat('%Y-%m')));

        // 添加Y轴
        const yAxis = g => g
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));

        svg.append('g').call(xAxis);
        svg.append('g').call(yAxis);

        // 添加零线
        svg.append('line')
            .attr('x1', margin.left)
            .attr('x2', width - margin.right)
            .attr('y1', y(0))
            .attr('y2', y(0))
            .attr('stroke', '#666')
            .attr('stroke-dasharray', '4,4')
            .attr('stroke-width', 1);

        // 添加标题和标签
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', margin.top / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('情感时间线分析');

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height - 10)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('时间');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 15)
            .attr('x', -height / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('情感极性');
    }

    renderWordCloud(data) {
        const container = d3.select('#wordcloud');
        container.html('');

        if (!data || data.length === 0) {
            container.html('<div class="loading">暂无关键词数据</div>');
            return;
        }

        const width = 600;
        const height = 400;

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);

        // 创建字体大小比例尺
        const fontSize = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.size)])
            .range([12, 50]);

        // 简单的词云布局
        const centerX = width / 2;
        const centerY = height / 2;

        svg.selectAll('text')
            .data(data)
            .enter()
            .append('text')
            .text(d => d.text)
            .attr('x', (d, i) => {
                const angle = (i / data.length) * 2 * Math.PI;
                const radius = Math.min(width, height) * 0.3;
                return centerX + Math.cos(angle) * radius;
            })
            .attr('y', (d, i) => {
                const angle = (i / data.length) * 2 * Math.PI;
                const radius = Math.min(width, height) * 0.3;
                return centerY + Math.sin(angle) * radius;
            })
            .attr('font-size', d => fontSize(d.size))
            .attr('fill', (d, i) => d3.schemeCategory10[i % 10])
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .style('cursor', 'pointer')
            .on('mouseover', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('font-size', d => fontSize(d.size) + 5);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('font-size', d => fontSize(d.size));
            })
            .on('click', function(event, d) {
                alert(`关键词: ${d.text}\n出现次数: ${d.size}`);
            });

        // 添加标题
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('高频关键词');
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new ReviewPulseVisualization();
});