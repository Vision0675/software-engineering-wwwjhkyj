from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
# 预留给部署环境的配置读取逻辑
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:root_password@campus_mysql:3306/campus_task_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ==========================================
# 数据模型定义 (供队友直接复用)
# 严格按照最新 SRS 3.4 数据库逻辑需求编写
# ==========================================

class User(db.Model):
    __tablename__ = 'users'
    User_ID = db.Column(db.String(32), primary_key=True, comment="用户唯一ID")
    Student_ID = db.Column(db.String(20), unique=True, nullable=False, comment="学号")
    Department = db.Column(db.String(50), nullable=False, comment="院系")
    Phone = db.Column(db.String(11), nullable=False, comment="手机号")
    Credit_Score = db.Column(db.Integer, default=100, comment="信用分")
    Auth_Status = db.Column(db.Integer, default=0, comment="实名审核状态: 0未审 1自动通过 2人工复核")
    Violate_Record = db.Column(db.Text, comment="违规记录")

class Task(db.Model):
    __tablename__ = 'tasks'
    Task_ID = db.Column(db.String(32), primary_key=True, comment="任务ID")
    Task_Type = db.Column(db.String(20), nullable=False, comment="任务类型")
    Publisher_ID = db.Column(db.String(32), db.ForeignKey('users.User_ID'), nullable=False)
    Receiver_ID = db.Column(db.String(32), db.ForeignKey('users.User_ID'), nullable=True)
    Task_Location = db.Column(db.String(100), nullable=False, comment="任务位置")
    Task_Status = db.Column(db.Integer, default=0, comment="状态: 0待审 1待接单 2进行中 3已完成")
    Create_Time = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 新增：AI辅助分类与资金托管字段
    AI_Category_Tag = db.Column(db.String(50), comment="AI辅助分类标签")
    Escrow_Status = db.Column(db.Integer, default=0, comment="资金托管状态: 0未托管 1已托管 2已结算")

# ==========================================
# B端后台核心业务接口
# ==========================================

@app.route('/admin/tasks/<task_id>/audit', methods=['PUT'])
def audit_task(task_id):
    """
    任务审核接口 (对应 SRS 3.2.1)
    """
    data = request.get_json()
    action = data.get('action')
    
    task = Task.query.filter_by(Task_ID=task_id).first()
    if not task:
        return jsonify({"code": 40400, "message": "任务不存在", "data": {}}), 404

    if action == 'pass':
        task.Task_Status = 1  # 变更为待接单状态
        message = "审核通过，已上架"
    elif action == 'reject':
        task.Task_Status = -1 # 驳回状态
        message = "审核驳回"
    elif action == 'ai_flag':
        task.Task_Status = 0
        task.AI_Category_Tag = "高风险/需人工复核"
        message = "AI标记异常，转入人工复核"
    else:
        return jsonify({"code": 40000, "message": "无效的操作参数", "data": {}}), 400

    try:
        db.session.commit()
        return jsonify({
            "code": 20000,
            "message": message,
            "data": {
                "Task_ID": task.Task_ID, 
                "Task_Status": task.Task_Status,
                "AI_Category_Tag": task.AI_Category_Tag
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"code": 50000, "message": "数据库写入异常", "data": {}}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8081)
