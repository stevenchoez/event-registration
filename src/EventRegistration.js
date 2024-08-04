import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AWS from 'aws-sdk';

const S3_BUCKET = 'photodynamo';
const API_URL = 'https://sqz673anr7.execute-api.us-east-1.amazonaws.com/default/handleeventregistration';

AWS.config.update({
aws_access_key_id: 'ASIARO3NBDN4QUB6SAB7',
aws_secret_access_key: '1vGpNW1uZex9sn7aQ5MmfoCiH76mSaEOaRpxvoLx',
aws_session_token: 'IQoJb3JpZ2luX2VjEMz//////////wEaCXVzLXdlc3QtMiJGMEQCICUBgApQa2y6/NHhKv5COMcdv7ggjG1lt0AhTGKhEyPRAiAyIkHuPR4vTKrPJdCyWzzupE+ekSrSBwaHcLGL+ofHHCqpAgi1//////////8BEAEaDDEwMDYyMzUyMjY4MSIMIPiCUXzpqsr6kNgbKv0BV0ETqIBR23IpP6OFdPz+OYIyDTKwBzuU4ktEmoTOzK9nw+cCkAkXM0Rua3d3uHXUqZ2wYzpO11rMK1LAHkmlOfZ/kCfI0adERvAzRjYj8UGVc1M8Ps1eUb/NiR/3iRaCCxfu1lce/uk7xhPBQHPKzlY3Hz/WHjDo5oofr8lQG0YqLAbocSIniIJHExvqrwXaqppqSY8kB//if600C+CgBlGZUYAIq1HMuBWP+d6xc3KqZGxjROeCBnNmF4/nO16FG/xkJ7wnlE2H4/f1XC3D/2Nfe9yQYGxvWvBkun5Qnk5/CV+Ftk5k2CpFszg4xLddb+PGQM27HT9Egv74bDD077u1BjqeASdinbJt+aq/R8yrRXVsIMF0h7fCX3DnWT5mxuH90kLgEbaARtKBbtLkHyX8qbIzzB8byh5W6p1Pf+oCXTjYQu1USvvyskcfXJMEh3e6ttUK+d6iY/B2B/IsMGxnfdLK5gYWSwdmGgO41QXzthPPL5UipIyMOh4LPcT8Y8x3vzFN8miFWyBwQIgC8S+Y7vq6Z/mh2ha7LkijZQGnZ4Rc',
region: 'us-east-1'
});

const s3 = new AWS.S3();

function EventRegistration() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    idNumber: '',
    email: '',
    photo: null
  });

  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await axios.get(`${API_URL}?TableName=EventRegistrations`);
      setRegistrations(response.data.Items || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, photo: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.photo) {
      try {
        const photoUrl = await uploadPhotoToS3(formData.photo);
        const registrationData = {
          TableName: 'EventRegistrations', 
          Item: {
            id_number: formData.idNumber,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            photo_url: photoUrl
          }
        };

        await axios.post(`${API_URL}`, registrationData, {
          headers: { 'Content-Type': 'application/json' }
        });
        fetchRegistrations(); 
      } catch (error) {
        console.error('Error submitting registration:', error);
      }
    }
  };

  const uploadPhotoToS3 = async (file) => {
    const fileName = `${Date.now()}_${file.name}`;
    const params = {
      Bucket: S3_BUCKET,
      Key: fileName,
      Body: file,
      ContentType: file.type
    };

    try {
      await s3.upload(params).promise();
      return `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`;
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  return (
    <div>
      <h1>Event Registration</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>First Name:</label>
          <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Last Name:</label>
          <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
        </div>
        <div>
          <label>ID Number:</label>
          <input type="text" name="idNumber" value={formData.idNumber} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Photo:</label>
          <input type="file" onChange={handleFileChange} required />
        </div>
        <button type="submit">Register</button>
      </form>
      <h2>Registered Users</h2>
      <ul>
        {registrations.map((reg) => (
          <li key={reg.id_number}>
            {reg.first_name} {reg.last_name} - {reg.email} - <a href={reg.photo_url} target="_blank" rel="noopener noreferrer">View Photo</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EventRegistration;