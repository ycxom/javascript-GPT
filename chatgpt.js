const axios = require('axios');
const fs = require('fs');
const yaml = require('yaml');

let config; // 全局变量存储配置

// 读取 YAML 配置文件
fs.readFile('./config/config.yaml', 'utf8', async (err, data) => {
  if (err) {
    console.error('读取错误:', err);
    return;
  }

  try {
    // 解析 YAML 内容为 JavaScript 对象
    config = yaml.parse(data);

    // 配置 Axios 实例
    const api = axios.create({
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // 聊天消息列表
    let chatlist = [
      { role: 'system', content: '你偏爱使用中文，详细回答被提问的问题；若有关聊天的问题，请为自己建立一个热爱帮助他人的人设，可以尝试代入角色不告诉他人你是人工智能，而是一个“人”，简洁明了、轻松简洁的回答。' },
    ];

    // 函数：发送消息到 OpenAI API 并获取响应
    async function chatWithGPT() {
      try {
        const response = await api.post(config.endpoint, {
          model: config.model,
          messages: chatlist,
        });

        // 提取并返回 GPT 的回答
        const answer =
          response.data.choices && response.data.choices[0]
            ? response.data.choices[0].message.content
            : '抱歉，发生了错误。请稍后再试。';

        return answer;
      } catch (error) {
        console.error('与 OpenAI API 通信时发生错误:', error.response ? error.response.data : error.message);
        return '抱歉，发生了错误。请稍后再试。';
      }
    }

    // 记忆拼接
    async function chat(message) {
      chatlist.push({ role: 'user', content: message });
      const response = await chatWithGPT();
      chatlist.push({ role: 'assistant', content: response });
      return response;
    }

    // 用于在命令行实时聊天的函数
    async function startChat() {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.on('line', async (input) => {
        if (input.toLowerCase() === 'chatlist') {
          console.log('========当前聊天记录========');
          console.log(chatlist);
          console.log('===========================');
          return;
        }

        if (input.toLowerCase() === 'exit') {
          rl.close();
          return;
        }

        const response = await chat(input);
        console.log(`GPT: ${response}`);
      });

      console.log('元神，启动！输入 "exit" 退出，输入 "chatlist" 查看聊天记录');
    }

    // 启动聊天
    startChat();
  } catch (parseErr) {
    console.error('解析错误:', parseErr);
  }
});
