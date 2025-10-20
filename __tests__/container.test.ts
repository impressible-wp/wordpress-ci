import {_getContainerInfoByDNSName} from '../src/container'
import * as system from '../src/system'

// Mock the system module
jest.mock('../src/system', () => ({
  _exec: jest.fn()
}))

const mockExec = system._exec as jest.MockedFunction<typeof system._exec>

describe('container module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('_getContainerInfoByDNSName', () => {
    it('should find container by DNS name match', async () => {
      // Mock docker ps -q response
      mockExec.mockResolvedValueOnce({
        stdout: 'container1\ncontainer2\n',
        stderr: ''
      })

      // Mock docker inspect response
      const mockContainerInfo = [
        {
          Id: 'container1',
          NetworkSettings: {
            Networks: {
              bridge: {
                DNSNames: ['app.docker.local', 'webapp']
              },
              'custom-network': {
                DNSNames: ['app.custom.local']
              }
            }
          }
        },
        {
          Id: 'container2',
          NetworkSettings: {
            Networks: {
              bridge: {
                DNSNames: ['db.docker.local', 'database']
              }
            }
          }
        }
      ]

      mockExec.mockResolvedValueOnce({
        stdout: JSON.stringify(mockContainerInfo),
        stderr: ''
      })

      const result = await _getContainerInfoByDNSName('webapp')

      expect(result).toEqual({
        NetworkName: 'bridge',
        DNSNames: ['app.docker.local', 'webapp'],
        ContainerInfo: mockContainerInfo[0]
      })

      // Verify the correct docker commands were called
      expect(mockExec).toHaveBeenCalledTimes(2)
      expect(mockExec).toHaveBeenNthCalledWith(1, ['docker', 'ps', '-q'])
      expect(mockExec).toHaveBeenNthCalledWith(2, [
        'docker',
        'inspect',
        'container1',
        'container2'
      ])
    })

    it('should find container by partial DNS name match', async () => {
      // Mock docker ps -q response
      mockExec.mockResolvedValueOnce({
        stdout: 'container1\n',
        stderr: ''
      })

      // Mock docker inspect response
      const mockContainerInfo = [
        {
          Id: 'container1',
          NetworkSettings: {
            Networks: {
              'custom-network': {
                DNSNames: ['my-app.custom.docker.local', 'api-service']
              }
            }
          }
        }
      ]

      mockExec.mockResolvedValueOnce({
        stdout: JSON.stringify(mockContainerInfo),
        stderr: ''
      })

      const result = await _getContainerInfoByDNSName('custom.docker')

      expect(result).toEqual({
        NetworkName: 'custom-network',
        DNSNames: ['my-app.custom.docker.local', 'api-service'],
        ContainerInfo: mockContainerInfo[0]
      })
    })

    it('should throw error when no container matches DNS name', async () => {
      // Mock docker ps -q response
      mockExec.mockResolvedValueOnce({
        stdout: 'container1\n',
        stderr: ''
      })

      // Mock docker inspect response
      const mockContainerInfo = [
        {
          Id: 'container1',
          NetworkSettings: {
            Networks: {
              bridge: {
                DNSNames: ['different-app.docker.local', 'other-service']
              }
            }
          }
        }
      ]

      mockExec.mockResolvedValueOnce({
        stdout: JSON.stringify(mockContainerInfo),
        stderr: ''
      })

      await expect(_getContainerInfoByDNSName('nonexistent')).rejects.toThrow(
        'No container found with DNS name matching: nonexistent'
      )
    })

    it('should handle empty container list', async () => {
      // Mock docker ps -q response with no containers
      mockExec.mockResolvedValueOnce({
        stdout: '',
        stderr: ''
      })

      // Mock docker inspect response with empty array
      mockExec.mockResolvedValueOnce({
        stdout: '[]',
        stderr: ''
      })

      await expect(_getContainerInfoByDNSName('any-name')).rejects.toThrow(
        'No container found with DNS name matching: any-name'
      )

      // Should still call docker inspect even with no containers
      expect(mockExec).toHaveBeenCalledTimes(2)
      expect(mockExec).toHaveBeenNthCalledWith(2, ['docker', 'inspect'])
    })

    it('should handle containers with multiple networks', async () => {
      // Mock docker ps -q response
      mockExec.mockResolvedValueOnce({
        stdout: 'multi-network-container\n',
        stderr: ''
      })

      // Mock docker inspect response
      const mockContainerInfo = [
        {
          Id: 'multi-network-container',
          NetworkSettings: {
            Networks: {
              network1: {
                DNSNames: ['service1.net1.local']
              },
              network2: {
                DNSNames: ['service1.net2.local', 'target-service']
              },
              network3: {
                DNSNames: ['service1.net3.local']
              }
            }
          }
        }
      ]

      mockExec.mockResolvedValueOnce({
        stdout: JSON.stringify(mockContainerInfo),
        stderr: ''
      })

      const result = await _getContainerInfoByDNSName('target-service')

      expect(result).toEqual({
        NetworkName: 'network2',
        DNSNames: ['service1.net2.local', 'target-service'],
        ContainerInfo: mockContainerInfo[0]
      })
    })

    it('should handle containers with empty DNS names', async () => {
      // Mock docker ps -q response
      mockExec.mockResolvedValueOnce({
        stdout: 'container1\ncontainer2\n',
        stderr: ''
      })

      // Mock docker inspect response
      const mockContainerInfo = [
        {
          Id: 'container1',
          NetworkSettings: {
            Networks: {
              bridge: {
                DNSNames: []
              }
            }
          }
        },
        {
          Id: 'container2',
          NetworkSettings: {
            Networks: {
              bridge: {
                DNSNames: ['found-service']
              }
            }
          }
        }
      ]

      mockExec.mockResolvedValueOnce({
        stdout: JSON.stringify(mockContainerInfo),
        stderr: ''
      })

      const result = await _getContainerInfoByDNSName('found-service')

      expect(result).toEqual({
        NetworkName: 'bridge',
        DNSNames: ['found-service'],
        ContainerInfo: mockContainerInfo[1]
      })
    })
  })
})
