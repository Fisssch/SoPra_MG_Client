'use client';

import '@ant-design/v5-patch-for-react-19';
import { useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Button, Form, Input, App } from 'antd';
import { useState } from 'react';
import { User } from '@/types/user';
import { calculateHash } from '@/utils/hash';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

interface UserDTO {
	username: string;
	password: string;
}

const Register: React.FC = () => {
	const router = useRouter();
	const apiService = useApi();
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);

	const { set: setToken } = useLocalStorage<string>('token', '');
	const { set: setUserId } = useLocalStorage<string>('id', '');

	const { message } = App.useApp();

	const handleRegister = async (values: UserDTO) => {
		setLoading(true);

		try {
			const hashedPassword = await calculateHash(values.password);

			const { data: user, headers } = await apiService.post<User>('/users', {
				username: values.username,
				password: hashedPassword,
			});

			const authHeader = headers.get('Authorization');
			if (authHeader?.startsWith('Bearer ')) {
				const token = authHeader.split(' ')[1];
				setToken(token);
			}

			if (user?.id) {
				setUserId(String(user.id));
				message.success('Registration successful!');
				router.push('/mainpage');
			}
		} catch (error: any) {
			if (error?.status === 409) {
				message.warning('Username already exists. Please choose another one.');
			} else {
				message.error(`Registration failed: ${error?.message}`);
			}
		} finally {
			setLoading(false);
		}
	};

	const handleBackToStart = () => {
		router.push('/');
	};

	return (
		<div
			className='min-h-screen flex items-center justify-center text-white text-center px-4 py-12'
			style={{
				background: 'linear-gradient(to right, #8b0000 0%, #a30000 10%, #c7adc4 50%,#8cc9d7 70%, #367d9f 90%, #1a425a 100%)',
			}}>
			<div className='login-container'>
				<Form form={form} name='register' size='large' onFinish={handleRegister} layout='vertical'>
					<h2 className='text-2xl font-semibold text-black mb-1!'>Create your account</h2>

					<Form.Item
						name='username'
						label={<span className='text-black'>Username</span>}
						rules={[
							{ required: true, message: 'Please input your username!' },
							{ min: 4, message: 'Username must be at least 4 characters' },
							{ max: 20, message: 'Username must be no more than 20 characters' },
							{
								validator: (_, value) => (value && /\s/.test(value) ? Promise.reject('Username cannot contain spaces ') : Promise.resolve()),
							},
						]}>
						<Input placeholder='Enter username' />
					</Form.Item>

					<Form.Item
						name='password'
						label={<span className='text-black'>Password</span>}
						rules={[
							{ required: true, message: 'Please input your password!' },
							{ min: 8, message: 'Password must be at least 8 characters' },
							{ max: 15, message: 'Password must be no more than 15 characters' },
							{
								validator: (_, value) => (value && /\s/.test(value) ? Promise.reject('Password cannot contain spaces') : Promise.resolve()),
							},
						]}>
						<Input.Password
							placeholder='Enter password'
							className='bg-white text-black'
							iconRender={visible => (visible ? <EyeOutlined style={{ color: '#ffffff' }} /> : <EyeInvisibleOutlined style={{ color: '#ffffff' }} />)}
						/>
					</Form.Item>

					<Form.Item>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
							<Button type='primary' htmlType='submit' loading={loading} style={{ width: '70%' }}>
								Register
							</Button>
							<Button onClick={handleBackToStart} className='back-button' style={{ width: '70%', fontSize: '0.95rem' }}>
								Back to Start Page
							</Button>
						</div>
					</Form.Item>
				</Form>
			</div>
		</div>
	);
};
export default Register;
