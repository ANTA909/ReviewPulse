import json
import os

def process_reviewpulse_data():
    """
    处理ReviewPulse项目的评论数据
    """
    try:
        # 使用正斜杠避免转义问题，或者使用原始字符串
        input_file = "C:/Users/13539/Desktop/ReviewPulse/Magazine_Subscriptions_5.json"
        output_file = "C:/Users/13539/Desktop/ReviewPulse/Magazine_Subscriptions_5_processed.json"
        
        print("开始处理ReviewPulse数据...")
        print(f"输入文件: {input_file}")
        
        # 首先检查文件是否存在
        if not os.path.exists(input_file):
            print(f"错误: 文件 {input_file} 不存在")
            return False
        
        # 尝试读取文件内容
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read().strip()
        
        print(f"文件大小: {len(content)} 字符")
        
        # 检查文件格式
        if content.startswith('[') and content.endswith(']'):
            print("检测到标准JSON数组格式")
            data = json.loads(content)
        else:
            print("检测到JSON行格式，正在转换...")
            # 处理JSON行格式（每行一个JSON对象）
            lines = content.split('\n')
            data = []
            for line in lines:
                line = line.strip()
                if line:
                    try:
                        data.append(json.loads(line))
                    except json.JSONDecodeError as e:
                        print(f"跳过无效行: {e}")
                        continue
        
        print(f"成功读取 {len(data)} 条记录")
        
        # 处理数据
        processed_data = []
        for i, item in enumerate(data):
            if not isinstance(item, dict):
                continue
                
            asin = item.get('asin')
            review_text = item.get('reviewText')
            review_time = item.get('reviewTime')
            
            # 检查必需字段
            if asin is None or review_text is None:
                continue
            
            asin = str(asin).strip()
            review_text = str(review_text).strip()
            review_time = str(review_time).strip() if review_time is not None else ""
            
            if not asin or not review_text:
                continue
            
            processed_item = {
                'asin': asin,
                'reviewText': review_text,
                'reviewTime': review_time
            }
            processed_data.append(processed_item)
            
            if (i + 1) % 1000 == 0:
                print(f"已处理 {i + 1} 条记录...")
        
        # 保存处理后的数据
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(processed_data, f, ensure_ascii=False, indent=2)
        
        print(f"\n处理完成!")
        print(f"原始数据: {len(data)} 条")
        print(f"有效数据: {len(processed_data)} 条")
        print(f"输出文件: {output_file}")
        
        # 显示样本
        if processed_data:
            print("\n前3条处理后的数据:")
            for i in range(min(3, len(processed_data))):
                item = processed_data[i]
                print(f"{i+1}. ASIN: {item['asin']}")
                print(f"   评论: {item['reviewText'][:50]}...")
                print(f"   时间: {item['reviewTime']}")
        
        return True
        
    except Exception as e:
        print(f"处理数据时出错: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    process_reviewpulse_data()