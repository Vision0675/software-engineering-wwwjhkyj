import pytest
import requests

# 测试环境全局网关地址
GATEWAY_URL = "http://localhost:80"

class TestCampusTaskFlow:
    """
    校园任务核心业务流联调测试
    前置条件：后端容器已启动，数据库已初始化
    """

    def setup_class(self):
        # 模拟生成全局测试数据
        self.publisher_id = "U_1001"
        self.test_task_id = None

    def test_01_publish_task(self):
        """测试用例：前端同学调用接口发布跑腿任务"""
        url = f"{GATEWAY_URL}/api/v1/tasks"
        payload = {
            "Task_Type": "跑腿代办",
            "Publisher_ID": self.publisher_id,
            "Task_Location": "同济大学嘉定校区图书馆",
            "Payment": 15.0
        }
        # 预留给队友的接口断言
        try:
            response = requests.post(url, json=payload, timeout=5)
            assert response.status_code == 200
            res_data = response.json()
            assert res_data['code'] == 20000
            
            # 保存任务 ID 供下游测试使用
            self.__class__.test_task_id = res_data['data']['Task_ID']
        except requests.exceptions.ConnectionError:
            pytest.skip("业务后端 API 尚未启动，跳过发布任务测试")

    def test_02_admin_audit_task(self):
        """测试用例：B端调用审核接口，状态流转"""
        if not self.test_task_id:
            # 若第一步未通，直接 mock 一个数据进行本节点测试
            self.__class__.test_task_id = "T_MOCK_001"
            
        url = f"{GATEWAY_URL}/admin/tasks/{self.test_task_id}/audit"
        payload = {"action": "pass", "audit_remark": "符合规范"}
        
        try:
            response = requests.put(url, json=payload, timeout=5)
            assert response.status_code == 200
            assert response.json()['data']['Task_Status'] == 1 # 验证状态是否正确变更为1(待接单)
        except requests.exceptions.ConnectionError:
            pytest.skip("Admin 后端尚未启动，跳过审核测试")
